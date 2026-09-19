import mongoose, { Schema, Document } from "mongoose"

export interface ICartItem {
  product: mongoose.Types.ObjectId
  quantity: number
  customText?: string
  customImage?: string
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId
  items: ICartItem[]
  totalAmount: number
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
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
