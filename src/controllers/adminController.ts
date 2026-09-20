import { Request, Response, NextFunction } from "express"
import { Order } from "../models/Order"
import { Product } from "../models/Product"
import { Category } from "../models/Category"
import { User } from "../models/User"
import { Banner } from "../models/Banner"
import { ApiError } from "../api/ApiError"
import { ApiResponse } from "../api/ApiResponse"
import { asyncHandler } from "../api/asyncHandler"

// ── Dashboard Metrics ──
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalOrders,
    paidOrders,
    pendingOrders,
    refundedOrders,
    totalCustomers,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.find({ paymentStatus: "paid" }),
    Order.countDocuments({ status: "processing" }),
    Order.countDocuments({ status: "refunded" }),
    User.countDocuments({ role: "user" }),
    Product.find({ stock: { $lte: 5 } }).select("name stock price images"),
    Order.find().sort("-createdAt").limit(8).populate("user", "name email"),
  ])

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)

  res.json(
    ApiResponse.success(
      {
        totalRevenue,
        totalOrders,
        pendingProcessing: pendingOrders,
        totalRefunds: refundedOrders,
        totalCustomers,
        lowStockProducts,
        recentOrders,
      },
      "Dashboard metrics retrieved"
    )
  )
})

// ── Category CRUD (Dynamic Navbar & Homepage Controls) ──
export const adminGetCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await Category.find().sort("sortOrder")
  res.json(ApiResponse.success(categories, "Categories retrieved"))
})

export const adminCreateCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, slug, description, image, showOnNavbar, navDisplayName, showOnHome, homeOrder, sortOrder } = req.body
  if (!name) return next(new ApiError(400, "Category name is required"))

  const categorySlug = slug
    ? slug.toLowerCase().trim().replace(/\s+/g, "-")
    : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")

  const existing = await Category.findOne({ slug: categorySlug })
  if (existing) return next(new ApiError(400, "Category with this slug already exists"))

  const category = await Category.create({
    name: name.trim(),
    slug: categorySlug,
    description,
    image,
    showOnNavbar: showOnNavbar !== undefined ? !!showOnNavbar : true,
    navDisplayName: navDisplayName || name,
    showOnHome: showOnHome !== undefined ? !!showOnHome : true,
    homeOrder: Number(homeOrder || 0),
    sortOrder: Number(sortOrder || 0),
    isActive: true,
  })

  res.status(201).json(ApiResponse.success(category, "Category created successfully"))
})

export const adminUpdateCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const category = await Category.findById(req.params.id)
  if (!category) return next(new ApiError(404, "Category not found"))

  if (req.body.name) category.name = req.body.name.trim()
  if (req.body.slug) category.slug = req.body.slug.toLowerCase().trim().replace(/\s+/g, "-")
  if (req.body.description !== undefined) category.description = req.body.description
  if (req.body.image !== undefined) category.image = req.body.image
  if (req.body.showOnNavbar !== undefined) category.showOnNavbar = !!req.body.showOnNavbar
  if (req.body.navDisplayName !== undefined) category.navDisplayName = req.body.navDisplayName
  if (req.body.showOnHome !== undefined) category.showOnHome = !!req.body.showOnHome
  if (req.body.homeOrder !== undefined) category.homeOrder = Number(req.body.homeOrder)
  if (req.body.sortOrder !== undefined) category.sortOrder = Number(req.body.sortOrder)
  if (req.body.isActive !== undefined) category.isActive = !!req.body.isActive

  await category.save()
  res.json(ApiResponse.success(category, "Category updated successfully"))
})

export const adminDeleteCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const category = await Category.findByIdAndDelete(req.params.id)
  if (!category) return next(new ApiError(404, "Category not found"))
  res.json(ApiResponse.success(null, "Category deleted successfully"))
})

// ── Product CRUD (With Gift Personalization Options) ──
export const adminGetProducts = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, page = 1, limit = 50 } = req.query
  const filter: any = {}

  if (category) filter.category = category
  if (search) {
    filter.name = new RegExp(String(search).trim(), "i")
  }

  const p = Math.max(1, Number(page))
  const l = Math.min(100, Math.max(1, Number(limit)))
  const skip = (p - 1) * l

  const [products, total] = await Promise.all([
    Product.find(filter).populate("category", "name slug").sort("-createdAt").skip(skip).limit(l),
    Product.countDocuments(filter),
  ])

  res.json(ApiResponse.success(products, "Products retrieved", { total, page: p, limit: l }))
})

export const adminCreateProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    name,
    slug,
    description,
    price,
    comparePrice,
    images,
    category,
    stock,
    isFeatured,
    isBestSeller,
    isPersonalizable,
    personalizationPrompt,
    allowCustomImageUpload,
    giftOccasions,
    recipient,
    tags,
    bulkPricingTiers,
    personalizationZones,
    customAddonsEnabled,
    applicableAddons,
    hoverMediaType,
    hoverMediaUrl,
  } = req.body

  if (!name || !price || !category || !images || images.length === 0) {
    return next(new ApiError(400, "Name, price, category, and at least one image are required"))
  }

  const productSlug = slug
    ? slug.toLowerCase().trim().replace(/\s+/g, "-")
    : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")

  const product = await Product.create({
    name: name.trim(),
    slug: productSlug,
    description,
    price: Number(price),
    comparePrice: comparePrice ? Number(comparePrice) : undefined,
    images,
    category,
    stock: stock ? Number(stock) : 100,
    isFeatured: !!isFeatured,
    isBestSeller: !!isBestSeller,
    isPersonalizable: !!isPersonalizable,
    personalizationPrompt: personalizationPrompt || "Enter Name or Custom Text",
    allowCustomImageUpload: !!allowCustomImageUpload,
    personalizationZones: Array.isArray(personalizationZones) ? personalizationZones : [],
    bulkPricingTiers: Array.isArray(bulkPricingTiers) ? bulkPricingTiers : [],
    customAddonsEnabled: !!customAddonsEnabled,
    applicableAddons: Array.isArray(applicableAddons) ? applicableAddons : [],
    hoverMediaType: hoverMediaType || "image",
    hoverMediaUrl: hoverMediaUrl || undefined,
    giftOccasions: Array.isArray(giftOccasions) ? giftOccasions : [],
    recipient: Array.isArray(recipient) ? recipient : [],
    tags: Array.isArray(tags) ? tags : [],
  })

  res.status(201).json(ApiResponse.success(product, "Product created successfully"))
})

export const adminUpdateProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findById(req.params.id)
  if (!product) return next(new ApiError(404, "Product not found"))

  Object.assign(product, req.body)
  await product.save()

  res.json(ApiResponse.success(product, "Product updated successfully"))
})

export const adminDeleteProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) return next(new ApiError(404, "Product not found"))
  res.json(ApiResponse.success(null, "Product deleted"))
})

// ── Customers ──
export const adminGetCustomers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find({ role: "user" }).select("-password").sort("-createdAt")
  res.json(ApiResponse.success(users, "Customers retrieved"))
})

// ── Banners ──
export const adminGetBanners = asyncHandler(async (req: Request, res: Response) => {
  const banners = await Banner.find().sort("order")
  res.json(ApiResponse.success(banners, "Banners retrieved"))
})

export const adminCreateBanner = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { title, subtitle, tag, imageUrl, link, buttonText, type, order } = req.body
  if (!title || !imageUrl) return next(new ApiError(400, "Title and Image are required"))

  const banner = await Banner.create({
    title,
    subtitle,
    tag,
    imageUrl,
    link: link || "/products",
    buttonText: buttonText || "Shop Now",
    type: type || "hero",
    order: Number(order || 0),
    isActive: true,
  })

  res.status(201).json(ApiResponse.success(banner, "Banner created successfully"))
})

export const adminUpdateBanner = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!banner) return next(new ApiError(404, "Banner not found"))
  res.json(ApiResponse.success(banner, "Banner updated successfully"))
})

export const adminDeleteBanner = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const banner = await Banner.findByIdAndDelete(req.params.id)
  if (!banner) return next(new ApiError(404, "Banner not found"))
  res.json(ApiResponse.success(null, "Banner deleted"))
})
