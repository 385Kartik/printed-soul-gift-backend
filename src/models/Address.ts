import mongoose, { Schema, Document } from "mongoose"

export interface IAddress extends Document {
  user: mongoose.Types.ObjectId
  label: "Home" | "Office" | "Work" | "Other"
  fullName: string
  phone: string
  street: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
}

const AddressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, default: "Home" },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Address = mongoose.model<IAddress>("Address", AddressSchema)
