import { Request, Response, NextFunction } from "express"
import { Address } from "../models/Address"
import { Review } from "../models/Review"
import { Product } from "../models/Product"
import { ApiError } from "../api/ApiError"
import { ApiResponse } from "../api/ApiResponse"
import { asyncHandler } from "../api/asyncHandler"

// ── Addresses ──
export const getAddresses = asyncHandler(async (req: any, res: Response) => {
  const addresses = await Address.find({ user: req.user.id }).sort("-createdAt")
  res.json(ApiResponse.success(addresses, "Addresses retrieved"))
})

export const createAddress = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { label, fullName, phone, street, city, state, pincode, isDefault } = req.body

  if (!fullName || !phone || !street || !city || !state || !pincode) {
    return next(new ApiError(400, "All address fields are required"))
  }

  if (isDefault) {
    await Address.updateMany({ user: req.user.id }, { isDefault: false })
  }

  const address = await Address.create({
    user: req.user.id,
    label: label || "Home",
    fullName,
    phone,
    street,
    city,
    state,
    pincode,
    isDefault: !!isDefault,
  })

  res.status(201).json(ApiResponse.success(address, "Address saved successfully"))
})

export const updateAddress = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user.id })
  if (!address) return next(new ApiError(404, "Address not found"))

  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user.id }, { isDefault: false })
  }

  Object.assign(address, req.body)
  await address.save()

  res.json(ApiResponse.success(address, "Address updated"))
})

export const deleteAddress = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id })
  if (!address) return next(new ApiError(404, "Address not found"))
  res.json(ApiResponse.success(null, "Address deleted"))
})

// ── Reviews ──
export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await Review.find({ product: req.params.productId, isApproved: true }).sort("-createdAt")
  res.json(ApiResponse.success(reviews, "Reviews retrieved"))
})

export const createReview = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { productId, rating, title, comment } = req.body
  if (!productId || !rating || !comment) {
    return next(new ApiError(400, "Rating and comment are required"))
  }

  const product = await Product.findById(productId)
  if (!product) return next(new ApiError(404, "Product not found"))

  const review = await Review.create({
    product: productId,
    user: req.user.id,
    userName: req.user.name,
    rating: Number(rating),
    title,
    comment,
    isApproved: true,
  })

  // Recalculate average rating
  const allReviews = await Review.find({ product: productId, isApproved: true })
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
  product.ratings.average = Number(avg.toFixed(1))
  product.ratings.count = allReviews.length
  await product.save()

  res.status(201).json(ApiResponse.success(review, "Review submitted successfully"))
})
