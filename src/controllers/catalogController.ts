import { Request, Response, NextFunction } from "express"
import { Category } from "../models/Category"
import { Product } from "../models/Product"
import { ApiError } from "../api/ApiError"
import { ApiResponse } from "../api/ApiResponse"
import { asyncHandler } from "../api/asyncHandler"

// ── Categories for Dynamic Navbar ──
export const getNavbarCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true, showOnNavbar: true })
    .sort("sortOrder")
    .select("name slug navDisplayName image")

  const formatted = categories.map((c) => ({
    _id: c._id,
    name: c.name,
    displayName: c.navDisplayName && c.navDisplayName.trim().length > 0 ? c.navDisplayName : c.name,
    slug: c.slug,
    image: c.image,
  }))

  res.json(ApiResponse.success(formatted, "Navbar categories retrieved"))
})

// ── Categories for Homepage Strip / Icons ──
export const getHomeCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true, showOnHome: true })
    .sort("homeOrder")
    .select("name slug image description")

  res.json(ApiResponse.success(categories, "Home categories retrieved"))
})

// ── All Categories ──
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true }).sort("sortOrder")
  res.json(ApiResponse.success(categories, "Categories retrieved"))
})

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
  if (!category) return next(new ApiError(404, "Category not found"))
  res.json(ApiResponse.success(category, "Category retrieved"))
})

// ── Products List with Smart Filters ──
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    occasion,
    recipient,
    isPersonalizable,
    sort,
    page = 1,
    limit = 24,
  } = req.query

  const query: any = { isActive: true }

  // Category filter by ID or slug
  if (category) {
    const cat = await Category.findOne({
      $or: [{ slug: category }, { _id: category.toString().match(/^[0-9a-fA-F]{24}$/) ? category : null }],
    })
    if (cat) query.category = cat._id
  }

  // Search filter
  if (search && typeof search === "string" && search.trim()) {
    const q = search.trim()
    query.$or = [
      { name: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
      { tags: new RegExp(q, "i") },
    ]
  }

  // Price range
  if (minPrice || maxPrice) {
    query.price = {}
    if (minPrice) query.price.$gte = Number(minPrice)
    if (maxPrice) query.price.$lte = Number(maxPrice)
  }

  // Occasion & Recipient filters
  if (occasion) query.giftOccasions = occasion
  if (recipient) query.recipient = recipient
  if (isPersonalizable === "true") query.isPersonalizable = true

  // Sorting
  let sortOption: any = { createdAt: -1 }
  if (sort === "price-low") sortOption = { price: 1 }
  else if (sort === "price-high") sortOption = { price: -1 }
  else if (sort === "popular") sortOption = { "ratings.average": -1, "ratings.count": -1 }
  else if (sort === "bestseller") sortOption = { isBestSeller: -1 }

  const p = Math.max(1, Number(page))
  const l = Math.min(100, Math.max(1, Number(limit)))
  const skip = (p - 1) * l

  const [products, total] = await Promise.all([
    Product.find(query).populate("category", "name slug").sort(sortOption).skip(skip).limit(l),
    Product.countDocuments(query),
  ])

  res.json(
    ApiResponse.success(products, "Products retrieved", {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    })
  )
})

// ── Single Product by Slug ──
export const getProductBySlug = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate("category")
  if (!product) return next(new ApiError(404, "Product not found"))
  res.json(ApiResponse.success(product, "Product details retrieved"))
})

// ── Featured Products ──
export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate("category", "name slug")
    .limit(12)
  res.json(ApiResponse.success(products, "Featured products retrieved"))
})

// ── Best Selling Products ──
export const getBestSellers = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.find({ isActive: true, isBestSeller: true })
    .populate("category", "name slug")
    .limit(12)
  res.json(ApiResponse.success(products, "Best selling products retrieved"))
})

// ── Similar Products ──
export const getSimilarProducts = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, currentProductId } = req.query
  if (!categoryId) return res.json(ApiResponse.success([], "No category provided"))

  const products = await Product.find({
    category: categoryId,
    _id: { $ne: currentProductId },
    isActive: true,
  })
    .limit(8)
    .populate("category", "name slug")

  res.json(ApiResponse.success(products, "Similar products retrieved"))
})
