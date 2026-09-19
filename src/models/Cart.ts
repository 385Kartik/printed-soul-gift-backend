import mongoose, { Schema, Document } from "mongoose"

export interface ISelectedAddon {
  addonId?: string
  title: string
  variantName: string
  price: number
  message?: string
}

export interface ICartItem {
  product: mongoose.Types.ObjectId
  quantity: number
  selectedTier?: {
    title: string
    unitPrice: number
  }
  selectedAddons?: ISelectedAddon[]
  customText?: string
  customImage?: string
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId
  items: ICartItem[]
  totalAmount: number
}

const SelectedAddonSchema = new Schema<ISelectedAddon>(
  {
    addonId: { type: String },
    title: { type: String, required: true },
    variantName: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    message: { type: String },
  },
  { _id: false }
)

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    selectedTier: {
      title: { type: String },
      unitPrice: { type: Number },
    },
    selectedAddons: [SelectedAddonSchema],
    customText: { type: String },
    customImage: { type: String },
  },
  { _id: false }
)

const CartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [CartItemSchema],
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Cart = mongoose.model<ICart>("Cart", CartSchema)
