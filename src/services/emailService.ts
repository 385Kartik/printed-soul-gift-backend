import nodemailer from "nodemailer"
import { logger } from "../utils/logger"
import { generateInvoiceBuffer } from "./invoiceService"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const sendEmail = async (to: string, subject: string, html: string, attachments?: any[]) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn(`SMTP credentials not set — skipping email to ${to}: [${subject}]`)
    return
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || "Printed Soul Gift <orders@printedsoulgift.com>",
      to,
      subject,
      html,
      attachments,
    })
    logger.info(`Email successfully sent to ${to}: ${subject}`)
  } catch (error: any) {
    logger.error(`Email delivery failed to ${to}: ${error.message}`)
  }
}

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; background: #fdf8f6; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #f3e8e2; }
    .header { background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 36px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { color: #fb7185; margin: 8px 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; }
    .body { padding: 32px 28px; color: #3f3f46; line-height: 1.6; }
    .body h2 { color: #18181b; font-size: 20px; margin-top: 0; font-weight: 700; }
    .btn { display: inline-block; background: #e11d48; color: #ffffff !important; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 20px 0; }
    .order-table { width: 100%; border-collapse: collapse; margin: 18px 0; }
    .order-table th { background: #faf5f5; padding: 10px 12px; text-align: left; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; }
    .order-table td { padding: 12px; border-top: 1px solid #f4f4f5; font-size: 13px; }
    .total-row td { font-weight: 800; border-top: 2px solid #e4e4e7; font-size: 14px; }
    .otp-box { background: #fff1f2; border: 1.5px dashed #f43f5e; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0; }
    .otp-code { letter-spacing: 8px; font-size: 36px; color: #e11d48; font-weight: 900; font-family: monospace; }
    .footer { background: #fafafa; padding: 24px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 Printed Soul Gift</h1>
      <p>Personalized Gifts & Celebrations</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Printed Soul Gift. Handcrafted with precision & love.</p>
      <p>Have questions? Reply to this email or chat with us on WhatsApp.</p>
    </div>
  </div>
</body>
</html>`

export const emailService = {
  async sendOtp(to: string, otp: string) {
    const html = baseTemplate(`
      <h2>Your Login Verification Code 🔐</h2>
      <p>Welcome back! Use the One-Time Password (OTP) below to access your Printed Soul Gift account:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <p style="color: #71717a; font-size: 12px;">This verification code is valid for 10 minutes. Please do not share it with anyone.</p>
    `)
    await sendEmail(to, "Your Printed Soul Gift Login Code", html)
  },

  async sendSignupOtp(to: string, otp: string) {
    const html = baseTemplate(`
      <h2>Welcome to Printed Soul Gift 🎉</h2>
      <p>We're thrilled to have you here! Please verify your email address with this 6-digit code:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <p style="color: #71717a; font-size: 12px;">This code expires in 10 minutes.</p>
    `)
    await sendEmail(to, "Verify Your Email - Printed Soul Gift", html)
  },

  async sendOrderConfirmation(to: string, name: string, order: any) {
    let pdfBuffer: Buffer | null = null
    try {
      pdfBuffer = await generateInvoiceBuffer(order)
    } catch (e: any) {
      logger.error(`Failed to generate PDF for order ${order.orderNumber}: ${e.message}`)
    }

    const itemsHtml = order.items
      .map(
        (i: any) => `
        <tr>
          <td>
            <strong>${i.name}</strong>
            ${i.customText ? `<br><small style="color:#e11d48;">Engraved: "${i.customText}"</small>` : ""}
          </td>
          <td style="text-align:center;">${i.quantity}</td>
          <td style="text-align:right;">₹${(i.price * i.quantity).toFixed(2)}</td>
        </tr>`
      )
      .join("")

    const html = baseTemplate(`
      <h2>Order Confirmed! 🎊</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for choosing Printed Soul Gift. We have received your order <strong>#${order.orderNumber}</strong> and our team is already preparing your personalized gifts!</p>
      
      <table class="order-table">
        <thead>
          <tr>
            <th>Gift Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="total-row">
            <td colspan="2">Total Paid (Prepaid via PayU):</td>
            <td style="text-align:right; color:#e11d48;">₹${order.totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <p><strong>Delivery Address:</strong><br>
        ${order.shippingAddress.fullName}<br>
        ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}
      </p>

      <div style="text-align:center;">
        <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/track?query=${order.orderNumber}" class="btn">
          Track Your Order Live
        </a>
      </div>
      <p style="font-size: 12px; color:#71717a;">Your official tax invoice is attached as a PDF with this email.</p>
    `)

    const attachments = pdfBuffer
      ? [
          {
            filename: `Invoice-${order.orderNumber}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ]
      : []

    await sendEmail(to, `Order Confirmed #${order.orderNumber} - Printed Soul Gift`, html, attachments)
  },

  async sendDispatched(to: string, name: string, order: any) {
    const trackingUrl =
      order.trackingUrl ||
      `https://www.delhivery.com/track/package/${encodeURIComponent(order.trackingNumber || "")}`

    const html = baseTemplate(`
      <h2>Your Gift is on its Way! 🚚</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Exciting news! Your order <strong>#${order.orderNumber}</strong> has been carefully packed and handed over to our courier partner <strong>Delhivery</strong>.</p>
      
      <div style="background:#f4f4f5; border-radius:12px; padding:18px; margin:20px 0;">
        <p style="margin:0; font-size:13px; color:#71717a;">Courier Partner:</p>
        <p style="margin:4px 0 12px 0; font-size:16px; font-weight:700; color:#18181b;">Delhivery Express</p>
        <p style="margin:0; font-size:13px; color:#71717a;">AWB Tracking Number:</p>
        <p style="margin:4px 0 0 0; font-size:18px; font-weight:800; color:#2563eb; font-family:monospace;">${order.trackingNumber || "Assigned"}</p>
      </div>

      <div style="text-align:center;">
        <a href="${trackingUrl}" class="btn" target="_blank">
          Track on Delhivery
        </a>
      </div>
    `)
    await sendEmail(to, `Dispatched: Your Order #${order.orderNumber} is on the way!`, html)
  },

  async sendRefundUpdate(to: string, name: string, order: any, refundNote?: string) {
    const html = baseTemplate(`
      <h2>Refund Processed Successfully 💳</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>This is to confirm that a refund of <strong>₹${(order.refundAmount || order.totalAmount).toFixed(2)}</strong> has been processed for order <strong>#${order.orderNumber}</strong>.</p>
      ${refundNote ? `<p><strong>Admin Note:</strong> ${refundNote}</p>` : ""}
      <p style="color:#71717a; font-size:13px;">The amount will be credited back to your original payment method (bank account / UPI / card) via PayU within 3-5 business days as per banking norms.</p>
    `)
    await sendEmail(to, `Refund Processed for Order #${order.orderNumber}`, html)
  },
}
