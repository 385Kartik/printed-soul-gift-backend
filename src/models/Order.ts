import mongoose, { Schema, Document } from "mongoose"

export type OrderStatus =
  | "pending"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refund_requested"
  | "refunded"

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export interface IOrderAddon {
  addonId?: string
  title: string
  variantName: string
  price: number
  message?: string
}

export interface IOrderItem {
  product: mongoose.Types.ObjectId
  name: string
  price: number
  quantity: number
  image?: string
  tierTitle?: string
  selectedAddons?: IOrderAddon[]
  customText?: string
  customImage?: string
}

export interface IOrderStatusHistory {
  status: OrderStatus
  timestamp: Date
  note?: string
}

export interface IOrder extends Document {
  orderNumber: string
  user?: mongoose.Types.ObjectId
  items: IOrderItem[]
  shippingAddress: {
    fullName: string
    phone: string
    street: string
    city: string
    state: string
    pincode: string
    country: string
  }
  paymentMethod: "payu"
  paymentStatus: PaymentStatus
  payuTxnId?: string
  payuMihpayId?: string
  courierPartner?: string
  trackingNumber?: string
  trackingUrl?: string
  status: OrderStatus
  statusHistory: IOrderStatusHistory[]
  itemsTotal: number
  shippingCharge: number
  totalAmount: number
  notes?: string
  cancelReason?: string
  refundReason?: string
  refundAmount?: number
  refundDate?: Date
  refundNotes?: string
  createdAt: Date
  updatedAt: Date
}

const OrderAddonSchema = new Schema<IOrderAddon>(
  {
    addonId: { type: String },
    title: { type: String, required: true },
    variantName: { type: String, required: true },
    price: { type: Number, required: true },
    message: { type: String },
  },
  { _id: false }
)

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    tierTitle: { type: String },
    selectedAddons: [OrderAddonSchema],
    customText: { type: String },
    customImage: { type: String },
  },
  { _id: false }
)

const OrderStatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
)

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    items: [OrderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    paymentMethod: { type: String, default: "payu" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    payuTxnId: { type: String },
    payuMihpayId: { type: String },
    courierPartner: { type: String, default: "Delhivery" },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "refund_requested",
        "refunded",
      ],
      default: "pending",
    },
    statusHistory: [OrderStatusHistorySchema],
    itemsTotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    notes: { type: String },
    cancelReason: { type: String },
    refundReason: { type: String },
    refundAmount: { type: Number },
    refundDate: { type: Date },
    refundNotes: { type: String },
  },
  { timestamps: true }
)

export const Order = mongoose.model<IOrder>("Order", OrderSchema)
