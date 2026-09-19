import mongoose, { Schema, Document } from "mongoose"

export interface IReview extends Document {
  product: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  userName: string
  rating: number
  title?: string
  comment: string
  isApproved: boolean
  helpfulVotes: number
  isVerifiedBuyer: boolean
}

const ReviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String, required: true },
    isApproved: { type: Boolean, default: true },
    helpfulVotes: { type: Number, default: 0 },
    isVerifiedBuyer: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Review = mongoose.model<IReview>("Review", ReviewSchema)
