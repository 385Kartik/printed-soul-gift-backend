import { Request, Response, NextFunction } from "express"
import mongoose from "mongoose"
import { Category } from "../models/Category"
import { Product } from "../models/Product"
import { ApiError } from "../api/ApiError"
import { ApiResponse } from "../api/ApiResponse"
import { asyncHandler } from "../api/asyncHandler"
import { catalogStore } from "../utils/catalogStore"

const isDbConnected = () => mongoose.connection.readyState === 1

// ── Categories for Dynamic Navbar ──
export const getNavbarCategories = asyncHandler(async (req: Request, res: Response) => {
  if (isDbConnected()) {
    try {
      const topCategories = await Category.find({
        isActive: true,
        showOnNavbar: true,
        $or: [{ parentCategory: null }, { parentCategory: { $exists: false } }],
      })
        .sort("sortOrder")
        .select("name slug navDisplayName image")

      if (topCategories.length > 0) {
        const formatted = await Promise.all(
          topCategories.map(async (c) => {
            const subs = await Category.find({
              parentCategory: c._id,
              isActive: true,
            })
              .sort("sortOrder")
              .select("name slug navDisplayName image")

            return {
              _id: c._id,
              name: c.name,
              displayName: c.navDisplayName && c.navDisplayName.trim().length > 0 ? c.navDisplayName : c.name,
              slug: c.slug,
              image: c.image,
              subCategories: subs.map((sub) => ({
                _id: sub._id,
                name: sub.name,
                displayName: sub.navDisplayName && sub.navDisplayName.trim().length > 0 ? sub.navDisplayName : sub.name,
                slug: sub.slug,
                image: sub.image,
              })),
            }
          })
        )
        return res.json(ApiResponse.success(formatted, "Navbar categories retrieved"))
      }
    } catch (e) {}
  }

  // Fallback to store categories
  const cats = catalogStore.getCategories().filter((c) => c.showOnNavbar && c.isActive)
  const formatted = cats.map((c) => ({
    _id: c._id,
    name: c.name,
    displayName: c.navDisplayName || c.name,
    slug: c.slug,
    image: c.image,
    subCategories: [],
  }))
  res.json(ApiResponse.success(formatted, "Navbar categories retrieved (Catalog)"))
})

// ── Categories for Homepage Strip / Icons ──
export const getHomeCategories = asyncHandler(async (req: Request, res: Response) => {
  if (isDbConnected()) {
    try {
      const categories = await Category.find({ isActive: true, showOnHome: true })
        .sort("homeOrder")
        .select("name slug image description parentCategory")
      if (categories.length > 0) {
        return res.json(ApiResponse.success(categories, "Home categories retrieved"))
      }
    } catch (e) {}
  }

  const cats = catalogStore.getCategories().filter((c) => c.showOnHome && c.isActive)
  res.json(ApiResponse.success(cats, "Home categories retrieved (Catalog)"))
})

// ── All Categories ──
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  if (isDbConnected()) {
    try {
      const categories = await Category.find({ isActive: true })
        .populate("parentCategory", "name slug")
        .sort("sortOrder")
      if (categories.length > 0) {
        return res.json(ApiResponse.success(categories, "Categories retrieved"))
      }
    } catch (e) {}
  }

  const cats = catalogStore.getCategories().filter((c) => c.isActive)
  res.json(ApiResponse.success(cats, "Categories retrieved (Catalog)"))
})

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (isDbConnected()) {
    try {
      const category = await Category.findOne({ slug: req.params.slug, isActive: true }).populate(
        "parentCategory",
        "name slug"
      )
      if (category) return res.json(ApiResponse.success(category, "Category retrieved"))
    } catch (e) {}
  }

  const cat = catalogStore.getCategories().find((c) => c.slug === req.params.slug)
  if (!cat) return next(new ApiError(404, "Category not found"))
  res.json(ApiResponse.success(cat, "Category retrieved (Catalog)"))
})

// ── Products List with Smart Filters ──
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    category,
    subCategory,
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

  if (isDbConnected()) {
    try {
      const query: any = { isActive: true }

      if (subCategory) {
        const subCat = await Category.findOne({
          $or: [{ slug: subCategory }, { _id: subCategory.toString().match(/^[0-9a-fA-F]{24}$/) ? subCategory : null }],
        })
        if (subCat) query.subCategory = subCat._id
      } else if (category) {
        const cat = await Category.findOne({
          $or: [{ slug: category }, { _id: category.toString().match(/^[0-9a-fA-F]{24}$/) ? category : null }],
        })
        if (cat) {
          const childCategories = await Category.find({ parentCategory: cat._id }).select("_id")
          const childIds = childCategories.map((c) => c._id)
          query.$or = [
            { category: cat._id },
            { subCategory: cat._id },
            ...(childIds.length > 0
              ? [{ category: { $in: childIds } }, { subCategory: { $in: childIds } }]
              : []),
          ]
        }
      }

      if (search && typeof search === "string" && search.trim()) {
        const q = search.trim()
        const searchOr = [
          { name: new RegExp(q, "i") },
          { description: new RegExp(q, "i") },
          { tags: new RegExp(q, "i") },
        ]
        if (query.$or) {
          query.$and = [{ $or: query.$or }, { $or: searchOr }]
          delete query.$or
        } else {
          query.$or = searchOr
        }
      }

      if (minPrice || maxPrice) {
        query.price = {}
        if (minPrice) query.price.$gte = Number(minPrice)
        if (maxPrice) query.price.$lte = Number(maxPrice)
      }

      if (occasion) query.giftOccasions = occasion
      if (recipient) query.recipient = recipient
      if (isPersonalizable === "true") query.isPersonalizable = true

      let sortOption: any = { createdAt: -1 }
      if (sort === "price-low") sortOption = { price: 1 }
      else if (sort === "price-high") sortOption = { price: -1 }
      else if (sort === "popular") sortOption = { "ratings.average": -1, "ratings.count": -1 }
      else if (sort === "bestseller") sortOption = { isBestSeller: -1 }

      const p = Math.max(1, Number(page))
      const l = Math.min(100, Math.max(1, Number(limit)))
      const skip = (p - 1) * l

      const [products, total] = await Promise.all([
        Product.find(query)
          .populate("category", "name slug")
          .populate("subCategory", "name slug")
          .sort(sortOption)
          .skip(skip)
          .limit(l),
        Product.countDocuments(query),
      ])

      if (total > 0) {
        return res.json(
          ApiResponse.success(products, "Products retrieved", {
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
          })
        )
      }
    } catch (e) {}
  }

  // Fallback to resilient catalog store
  let filtered = catalogStore.getProducts({
    category: category ? String(category) : undefined,
    search: search ? String(search) : undefined,
    isPersonalizable: isPersonalizable !== undefined ? String(isPersonalizable) : undefined,
  })

  const p = Math.max(1, Number(page))
  const l = Math.min(100, Math.max(1, Number(limit)))
  const skip = (p - 1) * l
  const paginated = filtered.slice(skip, skip + l)

  res.json(
    ApiResponse.success(paginated, "Products retrieved (Catalog)", {
      total: filtered.length,
      page: p,
      limit: l,
      totalPages: Math.ceil(filtered.length / l),
    })
  )
})

// ── Single Product by Slug ──
export const getProductBySlug = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (isDbConnected()) {
    try {
      const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate("category")
      if (product) return res.json(ApiResponse.success(product, "Product details retrieved"))
    } catch (e) {}
  }

  const p = catalogStore.getProductBySlug(req.params.slug)
  if (!p) return next(new ApiError(404, "Product not found"))
  res.json(ApiResponse.success(p, "Product details retrieved (Catalog)"))
})

// ── Featured Products ──
export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  if (isDbConnected()) {
    try {
      const products = await Product.find({ isActive: true, isFeatured: true })
        .populate("category", "name slug")
        .limit(12)
      if (products.length > 0) {
        return res.json(ApiResponse.success(products, "Featured products retrieved"))
      }
    } catch (e) {}
  }

  const prods = catalogStore.getProducts().filter((p) => p.isFeatured).slice(0, 12)
  res.json(ApiResponse.success(prods, "Featured products retrieved (Catalog)"))
})

// ── Best Selling Products ──
export const getBestSellers = asyncHandler(async (req: Request, res: Response) => {
  if (isDbConnected()) {
    try {
      const products = await Product.find({ isActive: true, isBestSeller: true })
        .populate("category", "name slug")
        .limit(12)
      if (products.length > 0) {
        return res.json(ApiResponse.success(products, "Best selling products retrieved"))
      }
    } catch (e) {}
  }

  const prods = catalogStore.getProducts().filter((p) => p.isBestSeller).slice(0, 12)
  res.json(ApiResponse.success(prods, "Best selling products retrieved (Catalog)"))
})

// ── Similar Products ──
export const getSimilarProducts = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, currentProductId } = req.query
  if (isDbConnected()) {
    try {
      const products = await Product.find({
        category: categoryId,
        _id: { $ne: currentProductId },
        isActive: true,
      })
        .limit(8)
        .populate("category", "name slug")
      if (products.length > 0) {
        return res.json(ApiResponse.success(products, "Similar products retrieved"))
      }
    } catch (e) {}
  }

  const prods = catalogStore
    .getProducts()
    .filter((p) => p._id !== currentProductId)
    .slice(0, 8)
  res.json(ApiResponse.success(prods, "Similar products retrieved (Catalog)"))
})
