import { Request, Response, NextFunction } from "express"
import { Cart } from "../models/Cart"
import { Product } from "../models/Product"
import { ApiError } from "../api/ApiError"
import { ApiResponse } from "../api/ApiResponse"
import { asyncHandler } from "../api/asyncHandler"

export const getCart = asyncHandler(async (req: any, res: Response) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate("items.product")
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [], totalAmount: 0 })
  }

  // Filter out any deleted products and recalculate total
  cart.items = cart.items.filter((i) => i.product != null)
  let total = 0
  cart.items.forEach((i: any) => {
    const unitPrice = i.selectedTier?.unitPrice || i.product?.price || 0
    const addonsTotal = (i.selectedAddons || []).reduce((s: number, a: any) => s + (a.price || 0), 0)
    total += (unitPrice + addonsTotal) * i.quantity
  })
  cart.totalAmount = total
  await cart.save()

  res.json(ApiResponse.success(cart, "Cart retrieved"))
})

export const addToCart = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { productId, quantity = 1, customText, customImage, selectedTier, selectedAddons } = req.body
  const product = await Product.findById(productId)
  if (!product) return next(new ApiError(404, "Product not found"))

  let cart = await Cart.findOne({ user: req.user.id })
  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [], totalAmount: 0 })
  }

  const targetTierTitle = selectedTier?.tierTitle || selectedTier?.title || ""

  const existingIdx = cart.items.findIndex(
    (i) =>
      i.product.toString() === productId &&
      (i.customText || "") === (customText || "") &&
      (i.selectedTier?.tierTitle || i.selectedTier?.title || "") === targetTierTitle
  )

  const normalizedTier = selectedTier
    ? {
        title: selectedTier.title || selectedTier.tierTitle || "",
        tierTitle: selectedTier.tierTitle || selectedTier.title || "",
        unitPrice: Number(selectedTier.unitPrice) || product.price,
        discountPercent: Number(selectedTier.discountPercent) || 0,
      }
    : undefined

  if (existingIdx > -1) {
    cart.items[existingIdx].quantity += Number(quantity)
    if (selectedAddons) cart.items[existingIdx].selectedAddons = selectedAddons
    if (normalizedTier) cart.items[existingIdx].selectedTier = normalizedTier
  } else {
    cart.items.push({
      product: productId,
      quantity: Number(quantity),
      selectedTier: normalizedTier,
      selectedAddons: Array.isArray(selectedAddons) ? selectedAddons : [],
      customText,
      customImage,
    })
  }

  await cart.save()
  await cart.populate("items.product")

  // Recalculate total amount with populated products
  let total = 0
  cart.items.forEach((i: any) => {
    const unitPrice = i.selectedTier?.unitPrice || i.product?.price || 0
    const addonsTotal = (i.selectedAddons || []).reduce((s: number, a: any) => s + (a.price || 0), 0)
    total += (unitPrice + addonsTotal) * i.quantity
  })
  cart.totalAmount = total
  await cart.save()

  res.json(ApiResponse.success(cart, "Item added to cart"))
})

export const updateCartItem = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { productId, quantity } = req.body
  const cart = await Cart.findOne({ user: req.user.id })
  if (!cart) return next(new ApiError(404, "Cart not found"))

  const itemIdx = cart.items.findIndex((i) => i.product.toString() === productId)
  if (itemIdx === -1) return next(new ApiError(404, "Item not in cart"))

  if (quantity <= 0) {
    cart.items.splice(itemIdx, 1)
  } else {
    cart.items[itemIdx].quantity = Number(quantity)
  }

  await cart.save()
  const updated = await Cart.findById(cart._id).populate("items.product")
  res.json(ApiResponse.success(updated, "Cart updated"))
})

export const removeFromCart = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { productId } = req.params
  const cart = await Cart.findOne({ user: req.user.id })
  if (!cart) return next(new ApiError(404, "Cart not found"))

  cart.items = cart.items.filter((i) => i.product.toString() !== productId)
  await cart.save()

  const updated = await Cart.findById(cart._id).populate("items.product")
  res.json(ApiResponse.success(updated, "Item removed from cart"))
})

export const clearCart = asyncHandler(async (req: any, res: Response) => {
  const cart = await Cart.findOne({ user: req.user.id })
  if (cart) {
    cart.items = []
    cart.totalAmount = 0
    await cart.save()
  }
  res.json(ApiResponse.success(null, "Cart cleared"))
})
