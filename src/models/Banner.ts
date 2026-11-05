import mongoose, { Schema, Document } from "mongoose"

export interface IBanner extends Document {
  title: string
  subtitle?: string
  tag?: string
  imageUrl: string
  videoUrl?: string
  mediaType: "image" | "video"
  size: "auto" | "full" | "medium" | "slim"
  position: "hero" | "middle" | "bottom"
  link?: string
  buttonText?: string
  type: string
  order: number
  isActive: boolean
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    tag: { type: String },
    imageUrl: { type: String, required: true },
    videoUrl: { type: String },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    size: { type: String, enum: ["auto", "full", "medium", "slim"], default: "auto" },
    position: { type: String, enum: ["hero", "middle", "bottom"], default: "hero" },
    link: { type: String, default: "/products" },
    buttonText: { type: String, default: "Shop Now" },
    type: { type: String, default: "hero" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Banner = mongoose.model<IBanner>("Banner", BannerSchema)
