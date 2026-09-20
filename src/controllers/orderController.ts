import { Request, Response, NextFunction } from "express"
import { Order, OrderStatus } from "../models/Order"
import { Cart } from "../models/Cart"
import { Product } from "../models/Product"
import { Address } from "../models/Address"
import { User } from "../models/User"
import { ApiError } from "../api/ApiError"
import { ApiResponse } from "../api/ApiResponse"
import { asyncHandler } from "../api/asyncHandler"
import { payuService } from "../services/payuService"
import { delhiveryService } from "../services/delhiveryService"
import { emailService } from "../services/emailService"
import { streamInvoicePdf } from "../services/invoiceService"

// ── 1. Create Order (Prepaid via PayU) ──
export const createOrder = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const {
    items: inputItems,
    shippingAddress: inputAddress,
    shippingAddressId,
    notes,
    guestEmail,
    guestName,
    guestPhone,
  } = req.body

  let userId = req.user?.id
  let userEmail = req.user?.email || guestEmail

  // Guest Checkout User Resolution
  if (!userId) {
    if (!guestEmail || !guestName || !guestPhone) {
      return next(new ApiError(400, "Checkout requires email, name, and phone"))
    }
    let user = await User.findOne({ email: guestEmail.toLowerCase().trim() })
    if (!user) {
      user = await User.create({
        name: guestName.trim(),
        email: guestEmail.toLowerCase().trim(),
        phone: guestPhone.trim(),
        role: "user",
        isVerified: false,
      })
    }
    userId = user._id
    userEmail = user.email
  }

  // Items Resolution
  let orderItemsRaw = inputItems
  if (!orderItemsRaw && userId) {
    const cartDoc = await Cart.findOne({ user: userId }).populate("items.product")
    if (cartDoc) {
      orderItemsRaw = cartDoc.items.map((i: any) => ({
        productId: i.product._id,
        quantity: i.quantity,
        productObj: i.product,
        selectedTier: i.selectedTier,
        selectedAddons: i.selectedAddons,
        customText: i.customText,
        customImage: i.customImage,
      }))
    }
  }

  if (!orderItemsRaw || orderItemsRaw.length === 0) {
    return next(new ApiError(400, "Cart is empty. Please add items to checkout."))
  }

  const items: any[] = []
  for (const raw of orderItemsRaw) {
    const product = raw.productObj || (await Product.findById(raw.productId || raw.product))
    if (!product) return next(new ApiError(404, "One or more products were not found"))
    if (product.stock < raw.quantity) {
      return next(new ApiError(400, `Insufficient stock for ${product.name}`))
    }

    const unitPrice = raw.selectedTier?.unitPrice || product.price
    const addonsTotal = (raw.selectedAddons || []).reduce((s: number, a: any) => s + (a.price || 0), 0)

    items.push({
      product: product._id,
      name: product.name,
      price: unitPrice + addonsTotal,
      quantity: raw.quantity,
      image: product.images?.[0] || "",
      tierTitle: raw.selectedTier?.title || "",
      selectedAddons: raw.selectedAddons || [],
      customText: raw.customText || "",
      customImage: raw.customImage || "",
    })
  }

  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  // Free Express Delhivery Pan-India on all orders
  const shippingCharge = 0
  const totalAmount = itemsTotal + shippingCharge

  // Shipping Address Resolution
  let finalAddress: any = inputAddress
  if (shippingAddressId) {
    const dbAddr = await Address.findOne({ _id: shippingAddressId, user: userId })
    if (!dbAddr) return next(new ApiError(404, "Shipping address not found"))
    finalAddress = {
      fullName: dbAddr.fullName,
      phone: dbAddr.phone,
      street: dbAddr.street,
      city: dbAddr.city,
      state: dbAddr.state,
      pincode: dbAddr.pincode,
      country: dbAddr.country || "India",
    }
  }

  if (
    !finalAddress ||
    !finalAddress.fullName ||
    !finalAddress.street ||
    !finalAddress.city ||
    !finalAddress.state ||
    !finalAddress.pincode
  ) {
    return next(new ApiError(400, "Please provide a complete delivery address"))
  }

  // Generate Unique Order Number e.g. PSG-100234
  const count = await Order.countDocuments()
  const orderNumber = `PSG-${10001 + count}`

  const order = await Order.create({
    orderNumber,
    user: userId,
    items,
    shippingAddress: finalAddress,
    paymentMethod: "payu",
    paymentStatus: "pending",
    itemsTotal,
    shippingCharge,
    totalAmount,
    notes,
    status: "pending",
    statusHistory: [{ status: "pending", timestamp: new Date(), note: "Order placed, awaiting PayU payment" }],
  })

  // Decrement Stock
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
  }

  // Clear Cart
  if (userId) {
    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [], totalAmount: 0 } }).catch(() => {})
  }

  const apiOrigin = process.env.API_URL || "http://localhost:5000"
  const uniqueTxnId = `${order.orderNumber}_${Date.now()}`

  const payuParams = {
    txnid: uniqueTxnId,
    amount: totalAmount,
    productinfo: `Printed Soul Gift Order #${order.orderNumber}`,
    firstname: finalAddress.fullName.split(" ")[0] || "Customer",
    email: userEmail,
    phone: finalAddress.phone,
    surl: `${apiOrigin}/api/orders/payu/callback`,
    furl: `${apiOrigin}/api/orders/payu/callback`,
  }

  const payuData = payuService.generatePaymentHash(payuParams)
  order.payuTxnId = uniqueTxnId
  await order.save()

  res.status(201).json(
    ApiResponse.success(
      {
        order,
        payu: {
          key: payuData.key,
          txnid: payuParams.txnid,
          amount: payuParams.amount,
          productinfo: payuParams.productinfo,
          firstname: payuParams.firstname,
          email: payuParams.email,
          phone: payuParams.phone,
          surl: payuParams.surl,
          furl: payuParams.furl,
          hash: payuData.hash,
          actionUrl: payuData.actionUrl,
        },
      },
      "Order created. Proceed to PayU payment."
    )
  )
})

// ── 2. PayU Callback (Auto-Push to Delhivery on Success) ──
export const handlePayuCallback = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body
  const isValidHash = payuService.verifyResponseHash(payload)
  const { status, txnid, mihpayid } = payload

  const orderNumber = txnid ? txnid.split("_")[0] : txnid
  const order = await Order.findOne({
    $or: [{ payuTxnId: txnid }, { orderNumber: txnid }, { orderNumber: orderNumber }],
  }).populate("user", "name email")

  const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173"

  if (!order) {
    return res.redirect(`${clientOrigin}/track?error=OrderNotFound`)
  }

  if (status === "success" && (isValidHash || process.env.PAYU_ENV === "sandbox" || !process.env.PAYU_MERCHANT_SALT)) {
    order.paymentStatus = "paid"
    order.status = "processing"
    order.payuTxnId = txnid
    order.payuMihpayId = mihpayid
    order.statusHistory.push({
      status: "processing",
      timestamp: new Date(),
      note: `Payment confirmed via PayU (MihPayID: ${mihpayid || "N/A"})`,
    })

    // ── AUTO-PUSH TO DELHIVERY ONE ──
    try {
      const result = await delhiveryService.createShipment(order)
      if (result.success && result.awbCode) {
        order.courierPartner = "Delhivery"
        order.trackingNumber = result.awbCode
        order.trackingUrl = delhiveryService.generateTrackingUrl(result.awbCode)
        order.statusHistory.push({
          status: "processing",
          timestamp: new Date(),
          note: `Shipment automatically created on Delhivery (AWB: ${result.awbCode})`,
        })
      } else {
        order.statusHistory.push({
          status: "processing",
          timestamp: new Date(),
          note: `Delhivery auto-push note: ${result.message}`,
        })
      }
    } catch (delErr: any) {
      console.error("Delhivery auto-push error:", delErr.message)
    }

    await order.save()

    // Send confirmation email with PDF invoice
    const customerUser = order.user as any
    const customerEmail = customerUser?.email || order.shippingAddress.phone // fallback
    const customerName = customerUser?.name || order.shippingAddress.fullName
    if (customerEmail) {
      emailService.sendOrderConfirmation(customerEmail, customerName, order).catch(() => {})
    }

    return res.redirect(`${clientOrigin}/order-success/${order.orderNumber}`)
  } else {
    order.paymentStatus = "failed"
    order.statusHistory.push({
      status: "pending",
      timestamp: new Date(),
      note: "PayU Payment failed or was cancelled",
    })
    await order.save()

    return res.redirect(`${clientOrigin}/track?query=${order.orderNumber}&payment=failed`)
  }
})

// ── 3. Customer: Track Order ──
export const trackOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const query = req.params.query?.trim()
  if (!query) return next(new ApiError(400, "Tracking query is required"))

  const order = await Order.findOne({
    $or: [{ orderNumber: query }, { trackingNumber: query }],
  }).populate("user", "name email")

  if (!order) return next(new ApiError(404, "Order not found with provided identifier"))

  let liveTracking: any = null
  if (order.trackingNumber && order.courierPartner?.toLowerCase().includes("delhivery")) {
    try {
      liveTracking = await delhiveryService.trackShipment(order.trackingNumber)
    } catch (e: any) {
      console.error("Delhivery live track error:", e.message)
    }
  }

  res.json(
    ApiResponse.success(
      {
        order,
        liveTracking,
      },
      "Tracking details retrieved"
    )
  )
})

// ── 4. Customer: My Orders ──
export const getMyOrders = asyncHandler(async (req: any, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user.id }).sort("-createdAt").skip(skip).limit(limit),
    Order.countDocuments({ user: req.user.id }),
  ])

  res.json(ApiResponse.success(orders, "Orders retrieved", { total, page, limit }))
})

export const getMyOrderById = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
  if (!order) return next(new ApiError(404, "Order not found"))
  res.json(ApiResponse.success(order, "Order details retrieved"))
})

// ── 5. Customer: Cancel Order ──
export const cancelOrder = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
  if (!order) return next(new ApiError(404, "Order not found"))

  const cancellable: OrderStatus[] = ["pending", "processing"]
  if (!cancellable.includes(order.status)) {
    return next(new ApiError(400, `Order cannot be cancelled in '${order.status}' stage`))
  }

  const { reason } = req.body
  order.status = "cancelled"
  order.cancelReason = reason || "Cancelled by customer"
  order.statusHistory.push({ status: "cancelled", timestamp: new Date(), note: order.cancelReason })

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
  }

  // Cancel shipment on Delhivery if AWB exists
  if (order.trackingNumber) {
    delhiveryService.cancelShipment(order.trackingNumber).catch(() => {})
  }

  await order.save()
  res.json(ApiResponse.success(order, "Order cancelled successfully"))
})

// ── 6. Download Invoice PDF ──
export const downloadOrderInvoice = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const order = await Order.findById(req.params.id)
  if (!order) return next(new ApiError(404, "Order not found"))

  streamInvoicePdf(order as any, res)
})

// ── 7. Admin: Get Orders with Filters ──
export const adminGetOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, paymentStatus, search, page = 1, limit = 20 } = req.query
  const filter: any = {}

  if (status) filter.status = status
  if (paymentStatus) filter.paymentStatus = paymentStatus

  if (search && typeof search === "string" && search.trim()) {
    const q = search.trim()
    const regex = new RegExp(q, "i")
    filter.$or = [
      { orderNumber: regex },
      { trackingNumber: regex },
      { "shippingAddress.fullName": regex },
      { "shippingAddress.phone": regex },
    ]
  }

  const p = Math.max(1, Number(page))
  const l = Math.min(100, Math.max(1, Number(limit)))
  const skip = (p - 1) * l

  const [orders, total] = await Promise.all([
    Order.find(filter).populate("user", "name email").sort("-createdAt").skip(skip).limit(l),
    Order.countDocuments(filter),
  ])

  res.json(ApiResponse.success(orders, "Orders retrieved", { total, page: p, limit: l }))
})

export const adminGetOrderById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const order = await Order.findById(req.params.id).populate("user", "name email phone")
  if (!order) return next(new ApiError(404, "Order not found"))
  res.json(ApiResponse.success(order, "Order details retrieved"))
})

// ── 8. Admin: Update Order Status ──
export const adminUpdateOrderStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { status, note } = req.body
  const order = await Order.findById(req.params.id).populate("user", "name email")
  if (!order) return next(new ApiError(404, "Order not found"))

  order.status = status
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note: note || `Status updated to ${status} by admin`,
  })

  await order.save()

  // If marked shipped, send email notification
  if (status === "shipped") {
    const cust = order.user as any
    const email = cust?.email || order.shippingAddress.phone
    const name = cust?.name || order.shippingAddress.fullName
    if (email) {
      emailService.sendDispatched(email, name, order).catch(() => {})
    }
  }

  res.json(ApiResponse.success(order, `Order status updated to ${status}`))
})

// ── 9. Admin: Manual 1-Click Push to Delhivery ──
export const adminPushToDelhivery = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const order = await Order.findById(req.params.id)
  if (!order) return next(new ApiError(404, "Order not found"))

  if (order.trackingNumber) {
    return next(new ApiError(400, `Delhivery AWB already generated: ${order.trackingNumber}`))
  }

  const result = await delhiveryService.createShipment(order)
  if (!result.success || !result.awbCode) {
    return next(new ApiError(400, result.message || "Failed to create shipment on Delhivery"))
  }

  order.courierPartner = "Delhivery"
  order.trackingNumber = result.awbCode
  order.trackingUrl = delhiveryService.generateTrackingUrl(result.awbCode)
  order.status = "packed"
  order.statusHistory.push({
    status: "packed",
    timestamp: new Date(),
    note: `Delhivery shipment created manually by admin (AWB: ${result.awbCode})`,
  })

  await order.save()
  res.json(ApiResponse.success(order, `Delhivery AWB generated: ${result.awbCode}`))
})

// ── 10. Admin: Process Refund ──
export const adminProcessRefund = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { refundAmount, refundReason, refundNotes } = req.body
  const order = await Order.findById(req.params.id).populate("user", "name email")
  if (!order) return next(new ApiError(404, "Order not found"))

  order.status = "refunded"
  order.paymentStatus = "refunded"
  order.refundAmount = Number(refundAmount) || order.totalAmount
  order.refundReason = refundReason || "Customer requested refund"
  order.refundNotes = refundNotes || ""
  order.refundDate = new Date()

  order.statusHistory.push({
    status: "refunded",
    timestamp: new Date(),
    note: `Refund of ₹${order.refundAmount} approved. Note: ${refundNotes || "Processed by admin"}`,
  })

  await order.save()

  // Send refund notification email
  const cust = order.user as any
  const email = cust?.email || order.shippingAddress.phone
  const name = cust?.name || order.shippingAddress.fullName
  if (email) {
    emailService.sendRefundUpdate(email, name, order, refundNotes).catch(() => {})
  }

  res.json(ApiResponse.success(order, `Refund of ₹${order.refundAmount} processed successfully`))
})
