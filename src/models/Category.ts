import mongoose, { Schema, Document } from "mongoose"

export interface ICategory extends Document {
  name: string
  slug: string
  description?: string
  image?: string
  showOnHome: boolean
  homeOrder: number
  showOnNavbar: boolean
  navDisplayName?: string
  sortOrder: number
  parentCategory?: mongoose.Types.ObjectId
  isActive: boolean
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    image: { type: String },
    showOnHome: { type: Boolean, default: true },
    homeOrder: { type: Number, default: 0 },
    showOnNavbar: { type: Boolean, default: true },
    navDisplayName: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    parentCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Category = mongoose.model<ICategory>("Category", CategorySchema)
