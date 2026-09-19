import mongoose, { Schema, Document } from "mongoose"

export interface IAddonVariant {
  _id?: string
  name: string
  price: number
  image?: string
  isDefault?: boolean
}

export interface IAddon extends Document {
  title: string
  type: string
  image?: string
  variants: IAddonVariant[]
  requiresMessage: boolean
  messagePlaceholder?: string
  appliesTo: "all" | "categories" | "products"
  applicableCategories?: mongoose.Types.ObjectId[]
  applicableProducts?: mongoose.Types.ObjectId[]
  isActive: boolean
  sortOrder: number
}

const AddonVariantSchema = new Schema<IAddonVariant>({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, default: 0, min: 0 },
  image: { type: String },
  isDefault: { type: Boolean, default: false },
})

const AddonSchema = new Schema<IAddon>(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, default: "custom" },
    image: { type: String },
    variants: [AddonVariantSchema],
    requiresMessage: { type: Boolean, default: false },
    messagePlaceholder: { type: String, default: "Write A Message" },
    appliesTo: {
      type: String,
      enum: ["all", "categories", "products"],
      default: "all",
    },
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Addon = mongoose.model<IAddon>("Addon", AddonSchema)
