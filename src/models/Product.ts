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

export interface IPersonalizationZone {
  id?: string
  name: string
  x: number // 0 - 100 percentage
  y: number // 0 - 100 percentage
  fontSize?: number // in px
  textColor?: string // hex or rgba
  fontFamily?: string // font family id e.g. sans, serif, signature, etc.
  rotation?: number // in degrees
  rotateX?: number // 3D surface tilt X in degrees (-80 to 80)
  rotateY?: number // 3D surface tilt Y in degrees (-80 to 80)
  skewX?: number // 2D surface shear X in degrees (-60 to 60)
  skewY?: number // 2D surface shear Y in degrees (-60 to 60)
  isCurved?: boolean
  curveRadius?: number // curvature -100 to 100
  hasBackground?: boolean
  backgroundColor?: string
  maxChars?: number
  sampleText?: string
}

export interface IProduct extends Document {
  name: string
  slug: string
  description?: string
  price: number
  comparePrice?: number
  images: string[]
  category: mongoose.Types.ObjectId
  subCategory?: mongoose.Types.ObjectId
  stock: number
  isFeatured: boolean
  isBestSeller: boolean
  isPersonalizable: boolean
  personalizationPrompt?: string
  allowCustomImageUpload: boolean
  personalizationZones?: IPersonalizationZone[]
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
  hoverMediaType?: "image" | "video" | "none"
  hoverMediaUrl?: string
  inclusions?: string[]
  specifications?: { label: string; value: string }[]
  allowAddons?: boolean
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

const PersonalizationZoneSchema = new Schema<IPersonalizationZone>(
  {
    id: { type: String },
    name: { type: String, required: true },
    x: { type: Number, required: true, default: 50 },
    y: { type: Number, required: true, default: 50 },
    fontSize: { type: Number, default: 18 },
    textColor: { type: String, default: "#ffffff" },
    fontFamily: { type: String, default: "sans" },
    rotation: { type: Number, default: 0 },
    rotateX: { type: Number, default: 0 },
    rotateY: { type: Number, default: 0 },
    skewX: { type: Number, default: 0 },
    skewY: { type: Number, default: 0 },
    isCurved: { type: Boolean, default: false },
    curveRadius: { type: Number, default: 30 },
    hasBackground: { type: Boolean, default: false },
    backgroundColor: { type: String, default: "rgba(0,0,0,0.4)" },
    maxChars: { type: Number, default: 16 },
    sampleText: { type: String },
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
    subCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    stock: { type: Number, required: true, default: 100, min: 0 },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isPersonalizable: { type: Boolean, default: false },
    personalizationPrompt: { type: String, default: "Enter Name or Custom Text" },
    allowCustomImageUpload: { type: Boolean, default: false },
    personalizationZones: [PersonalizationZoneSchema],
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
    hoverMediaType: { type: String, enum: ["image", "video", "none"], default: "image" },
    hoverMediaUrl: { type: String },
    inclusions: [{ type: String }],
    specifications: [
      {
        label: { type: String },
        value: { type: String },
      }
    ],
    allowAddons: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Product = mongoose.model<IProduct>("Product", ProductSchema)
