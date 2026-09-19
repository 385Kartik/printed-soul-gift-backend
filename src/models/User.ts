import mongoose, { Schema, Document } from "mongoose"
import bcrypt from "bcryptjs"

export interface IUser extends Document {
  name: string
  email: string
  password?: string
  phone?: string
  role: "user" | "admin" | "superadmin"
  isVerified: boolean
  otp?: string
  otpExpires?: Date
  avatar?: string
  comparePassword(candidate: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    phone: { type: String, trim: true },
    role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
    avatar: { type: String },
  },
  { timestamps: true }
)

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (err: any) {
    next(err)
  }
})

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(candidate, this.password)
}

export const User = mongoose.model<IUser>("User", UserSchema)
