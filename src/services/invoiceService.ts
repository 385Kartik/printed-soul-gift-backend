import PDFDocument from "pdfkit"
import { Response } from "express"

export interface InvoiceItem {
  name: string
  quantity: number
  price: number
  customText?: string
}

export interface InvoiceOrder {
  orderNumber: string
  createdAt?: string | Date
  paymentMethod: string
  paymentStatus: string
  payuTxnId?: string
  payuMihpayId?: string
  courierPartner?: string
  trackingNumber?: string
  shippingAddress: {
    fullName: string
    phone?: string
    street: string
    city: string
    state: string
    pincode: string
    country?: string
  }
  user?: {
    name?: string
    email?: string
    phone?: string
  }
  items: InvoiceItem[]
  itemsTotal: number
  shippingCharge: number
  totalAmount: number
}

function formatDate(dateInput?: string | Date): string {
  if (!dateInput) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  return new Date(dateInput).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function buildInvoiceDocument(order: InvoiceOrder): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    info: {
      Title: `Invoice-${order.orderNumber}`,
      Author: "Printed Soul Gift",
      Subject: "Tax Invoice",
    },
  })

  const pageWidth = 595.28
  const margin = 40
  const contentWidth = pageWidth - margin * 2

  // ── HEADER ──
  doc.fontSize(22).font("Helvetica-Bold").fillColor("#111827").text("PRINTED SOUL GIFT", margin, 40)
  doc.fontSize(9).font("Helvetica").fillColor("#6B7280").text("Personalized Gifts, Hampers & Corporate Kits", margin, 66)
  doc.fontSize(8).fillColor("#9CA3AF").text("Website: www.printedsoulgift.com  |  Support: support@printedsoulgift.com", margin, 78)

  // Invoice Title on Right
  doc.fontSize(16).font("Helvetica-Bold").fillColor("#111827").text("TAX INVOICE", margin, 40, { align: "right", width: contentWidth })
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#E11D48").text(`INV-${order.orderNumber}`, margin, 62, { align: "right", width: contentWidth })
  doc.fontSize(9).font("Helvetica").fillColor("#4B5563").text(`Date: ${formatDate(order.createdAt)}`, margin, 76, { align: "right", width: contentWidth })

  // Divider line
  doc.moveTo(margin, 98).lineTo(pageWidth - margin, 98).lineWidth(1).strokeColor("#E5E7EB").stroke()

  // ── DETAILS SECTION (TWO COLUMNS) ──
  const sectionTop = 112
  const colWidth = (contentWidth - 20) / 2

  // Left Column: Customer & Shipping
  doc.rect(margin, sectionTop, colWidth, 100).fillAndStroke("#F9FAFB", "#E5E7EB")
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#4B5563").text("BILLED & SHIPPED TO", margin + 12, sectionTop + 10)

  const customerName = order.shippingAddress?.fullName || order.user?.name || "Valued Customer"
  const customerPhone = order.shippingAddress?.phone || order.user?.phone || ""
  const street = order.shippingAddress?.street || ""
  const cityState = `${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.pincode || ""}`

  doc.fontSize(10).font("Helvetica-Bold").fillColor("#111827").text(customerName, margin + 12, sectionTop + 26, { width: colWidth - 24 })
  doc.fontSize(8.5).font("Helvetica").fillColor("#4B5563")
  if (customerPhone) doc.text(`Phone: ${customerPhone}`, margin + 12, sectionTop + 40, { width: colWidth - 24 })
  doc.text(street, margin + 12, sectionTop + 54, { width: colWidth - 24, height: 26, ellipsis: true })
  doc.text(cityState, margin + 12, sectionTop + 82, { width: colWidth - 24 })

  // Right Column: Order & Payment Info
  const rightColX = margin + colWidth + 20
  doc.rect(rightColX, sectionTop, colWidth, 100).fillAndStroke("#F9FAFB", "#E5E7EB")
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#4B5563").text("ORDER & PAYMENT DETAILS", rightColX + 12, sectionTop + 10)

  doc.fontSize(8.5).font("Helvetica").fillColor("#4B5563")
  doc.text(`Order Number: `, rightColX + 12, sectionTop + 26)
  doc.font("Helvetica-Bold").fillColor("#111827").text(order.orderNumber, rightColX + 85, sectionTop + 26)

  doc.font("Helvetica").fillColor("#4B5563").text(`Payment Mode: `, rightColX + 12, sectionTop + 40)
  doc.font("Helvetica-Bold").fillColor("#111827").text("PayU Online (Prepaid)", rightColX + 85, sectionTop + 40)

  doc.font("Helvetica").fillColor("#4B5563").text(`Payment Status: `, rightColX + 12, sectionTop + 54)
  const isPaid = order.paymentStatus === "paid"
  doc.font("Helvetica-Bold").fillColor(isPaid ? "#059669" : "#DC2626").text(order.paymentStatus.toUpperCase(), rightColX + 85, sectionTop + 54)

  if (order.trackingNumber) {
    doc.font("Helvetica").fillColor("#4B5563").text(`Courier AWB: `, rightColX + 12, sectionTop + 68)
    doc.font("Helvetica-Bold").fillColor("#2563EB").text(`${order.courierPartner || "Delhivery"} - ${order.trackingNumber}`, rightColX + 85, sectionTop + 68)
  }

  // ── ITEMS TABLE ──
  const tableTop = sectionTop + 120
  const colDesc = margin
  const colQty = margin + 300
  const colRate = margin + 370
  const colAmount = margin + 440

  doc.rect(margin, tableTop, contentWidth, 22).fill("#111827")
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#FFFFFF")
  doc.text("ITEM DESCRIPTION", colDesc + 10, tableTop + 6)
  doc.text("QTY", colQty, tableTop + 6, { width: 50, align: "center" })
  doc.text("PRICE", colRate, tableTop + 6, { width: 60, align: "right" })
  doc.text("TOTAL", colAmount, tableTop + 6, { width: 65, align: "right" })

  let currentY = tableTop + 22

  order.items.forEach((item, index) => {
    const isEven = index % 2 === 0
    if (isEven) {
      doc.rect(margin, currentY, contentWidth, 24).fill("#F9FAFB")
    }

    doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#111827")
    const title = item.customText ? `${item.name} [Engraved: "${item.customText}"]` : item.name
    doc.text(title, colDesc + 10, currentY + 7, { width: 280, height: 18, ellipsis: true })

    doc.font("Helvetica").fillColor("#374151")
    doc.text(String(item.quantity), colQty, currentY + 7, { width: 50, align: "center" })
    doc.text(`₹${item.price.toFixed(2)}`, colRate, currentY + 7, { width: 60, align: "right" })
    doc.font("Helvetica-Bold").fillColor("#111827")
    doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, colAmount, currentY + 7, { width: 65, align: "right" })

    currentY += 24
  })

  // Table bottom line
  doc.moveTo(margin, currentY).lineTo(pageWidth - margin, currentY).lineWidth(1).strokeColor("#E5E7EB").stroke()
  currentY += 12

  // ── TOTALS ──
  const totalsX = margin + 310
  const totalsValX = margin + 430
  const totalsWidth = 75

  doc.fontSize(8.5).font("Helvetica").fillColor("#4B5563")
  doc.text("Items Subtotal:", totalsX, currentY)
  doc.font("Helvetica-Bold").fillColor("#111827").text(`₹${order.itemsTotal.toFixed(2)}`, totalsValX, currentY, { width: totalsWidth, align: "right" })
  currentY += 16

  doc.font("Helvetica").fillColor("#4B5563").text("Shipping Charge:", totalsX, currentY)
  const shipText = order.shippingCharge === 0 ? "FREE" : `₹${order.shippingCharge.toFixed(2)}`
  doc.font("Helvetica-Bold").fillColor(order.shippingCharge === 0 ? "#059669" : "#111827").text(shipText, totalsValX, currentY, { width: totalsWidth, align: "right" })
  currentY += 18

  // Grand Total Box
  doc.rect(totalsX - 10, currentY, (pageWidth - margin) - (totalsX - 10), 26).fill("#F3F4F6")
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#111827")
  doc.text("Grand Total (INR):", totalsX, currentY + 7)
  doc.fontSize(11).fillColor("#E11D48").text(`₹${order.totalAmount.toFixed(2)}`, totalsValX, currentY + 6, { width: totalsWidth, align: "right" })

  currentY += 50

  // ── FOOTER / DECLARATION ──
  doc.fontSize(8).font("Helvetica-Bold").fillColor("#374151").text("Terms & Conditions:", margin, currentY)
  currentY += 12
  doc.font("Helvetica").fillColor("#6B7280").text(
    "1. All custom personalized gift items are created with precision craftsmanship.\n" +
    "2. For any query or defect, please contact support@printedsoulgift.com within 48 hours of delivery.\n" +
    "3. This is a computer-generated tax invoice and requires no physical signature.",
    margin,
    currentY,
    { width: contentWidth, lineGap: 3 }
  )

  return doc
}

export function streamInvoicePdf(order: InvoiceOrder, res: Response): void {
  const doc = buildInvoiceDocument(order)
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `inline; filename="Invoice-${order.orderNumber}.pdf"`)
  doc.pipe(res)
  doc.end()
}

export async function generateInvoiceBuffer(order: InvoiceOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = buildInvoiceDocument(order)
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
    doc.end()
  })
}
