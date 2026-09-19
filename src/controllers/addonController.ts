import { Request, Response } from "express"
import { Addon } from "../models/Addon"
import { Product } from "../models/Product"
import { asyncHandler } from "../api/asyncHandler"
import { ApiResponse } from "../api/ApiResponse"
import { ApiError } from "../api/ApiError"

// Public: Get applicable addons for a specific product
export const getAddonsForProduct = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params

  const product = await Product.findById(productId)
  if (!product) {
    throw new ApiError(404, "Product not found")
  }

  // If product has custom addons enabled and specific addons chosen
  if (product.customAddonsEnabled && product.applicableAddons && product.applicableAddons.length > 0) {
    const customAddons = await Addon.find({
      _id: { $in: product.applicableAddons },
      isActive: true,
    }).sort({ sortOrder: 1 })
    return res.status(200).json(ApiResponse.success(customAddons, "Addons retrieved"))
  }

  // Otherwise find global addons + category addons + product addons
  const addons = await Addon.find({
    isActive: true,
    $or: [
      { appliesTo: "all" },
      { appliesTo: "categories", applicableCategories: product.category },
      { appliesTo: "products", applicableProducts: product._id },
    ],
  }).sort({ sortOrder: 1 })

  return res.status(200).json(ApiResponse.success(addons, "Addons retrieved"))
})

// Admin: Get all addons
export const getAllAddons = asyncHandler(async (_req: Request, res: Response) => {
  const addons = await Addon.find()
    .populate("applicableCategories", "name slug")
    .populate("applicableProducts", "name slug")
    .sort({ sortOrder: 1, createdAt: -1 })

  return res.status(200).json(ApiResponse.success(addons, "All addons retrieved"))
})

// Admin: Create addon
export const createAddon = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    type,
    image,
    variants,
    requiresMessage,
    messagePlaceholder,
    appliesTo,
    applicableCategories,
    applicableProducts,
    isActive,
    sortOrder,
  } = req.body

  if (!title) {
    throw new ApiError(400, "Title is required")
  }

  const addon = await Addon.create({
    title,
    type: type || "custom",
    image,
    variants: Array.isArray(variants) ? variants : [],
    requiresMessage: Boolean(requiresMessage),
    messagePlaceholder: messagePlaceholder || "Write A Message",
    appliesTo: appliesTo || "all",
    applicableCategories: appliesTo === "categories" ? applicableCategories : [],
    applicableProducts: appliesTo === "products" ? applicableProducts : [],
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    sortOrder: Number(sortOrder) || 0,
  })

  return res.status(201).json(ApiResponse.success(addon, "Addon created successfully"))
})

// Admin: Update addon
export const updateAddon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const addon = await Addon.findById(id)
  if (!addon) {
    throw new ApiError(404, "Addon not found")
  }

  const {
    title,
    type,
    image,
    variants,
    requiresMessage,
    messagePlaceholder,
    appliesTo,
    applicableCategories,
    applicableProducts,
    isActive,
    sortOrder,
  } = req.body

  if (title !== undefined) addon.title = title
  if (type !== undefined) addon.type = type
  if (image !== undefined) addon.image = image
  if (variants !== undefined) addon.variants = variants
  if (requiresMessage !== undefined) addon.requiresMessage = Boolean(requiresMessage)
  if (messagePlaceholder !== undefined) addon.messagePlaceholder = messagePlaceholder
  if (appliesTo !== undefined) {
    addon.appliesTo = appliesTo
    addon.applicableCategories = appliesTo === "categories" ? applicableCategories : []
    addon.applicableProducts = appliesTo === "products" ? applicableProducts : []
  }
  if (isActive !== undefined) addon.isActive = Boolean(isActive)
  if (sortOrder !== undefined) addon.sortOrder = Number(sortOrder)

  await addon.save()

  return res.status(200).json(ApiResponse.success(addon, "Addon updated successfully"))
})

// Admin: Delete addon
export const deleteAddon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const addon = await Addon.findByIdAndDelete(id)
  if (!addon) {
    throw new ApiError(404, "Addon not found")
  }

  return res.status(200).json(ApiResponse.success(null, "Addon deleted successfully"))
})
