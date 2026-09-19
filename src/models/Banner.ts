import mongoose, { Schema, Document } from "mongoose"

export interface IBanner extends Document {
  title: string
  subtitle?: string
  tag?: string
  imageUrl: string
  link?: string
  buttonText?: string
  type: "hero" | "promo" | "strip"
  order: number
  isActive: boolean
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    tag: { type: String },
    imageUrl: { type: String, required: true },
    link: { type: String, default: "/products" },
    buttonText: { type: String, default: "Shop Now" },
    type: { type: String, enum: ["hero", "promo", "strip"], default: "hero" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Banner = mongoose.model<IBanner>("Banner", BannerSchema)
