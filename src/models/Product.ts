import mongoose, { Schema, Document } from "mongoose"

export interface IBulkPricingTier {
  title: string
  subtitle?: string
  minQty: number
  maxQty?: number
  discountPercent?: number
  unitPrice?: number
  badgeText?: string
  isMostPopular?: boolean
}

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
  bulkPricingTiers?: IBulkPricingTier[]
  customAddonsEnabled?: boolean
  applicableAddons?: mongoose.Types.ObjectId[]
  isActive: boolean
}

const BulkPricingTierSchema = new Schema<IBulkPricingTier>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    minQty: { type: Number, required: true, default: 1 },
    maxQty: { type: Number },
    discountPercent: { type: Number, default: 0 },
    unitPrice: { type: Number },
    badgeText: { type: String },
    isMostPopular: { type: Boolean, default: false },
  },
  { _id: false }
)

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
    bulkPricingTiers: [BulkPricingTierSchema],
    customAddonsEnabled: { type: Boolean, default: false },
    applicableAddons: [{ type: Schema.Types.ObjectId, ref: "Addon" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Product = mongoose.model<IProduct>("Product", ProductSchema)
