import mongoose, { Schema, Document } from "mongoose"

export interface IProduct extends Document {
  name: string
  slug: string
  description?: string
  price: number
  comparePrice?: number
  images: string[]
  category: mongoose.Types.ObjectId
  stock: number
  isFeatured: boolean
  isBestSeller: boolean
  isPersonalizable: boolean
  personalizationPrompt?: string
  allowCustomImageUpload: boolean
  giftOccasions: string[]
  recipient: string[]
  tags: string[]
  ratings: {
    average: number
    count: number
  }
  isActive: boolean
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    images: [{ type: String, required: true }],
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    stock: { type: Number, required: true, default: 100, min: 0 },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isPersonalizable: { type: Boolean, default: false },
    personalizationPrompt: { type: String, default: "Enter Name or Custom Text" },
    allowCustomImageUpload: { type: Boolean, default: false },
    giftOccasions: [{ type: String }],
    recipient: [{ type: String }],
    tags: [{ type: String }],
    ratings: {
      average: { type: Number, default: 5 },
      count: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Product = mongoose.model<IProduct>("Product", ProductSchema)
