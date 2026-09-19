import { Router } from "express"
import {
  getNavbarCategories,
  getHomeCategories,
  getCategories,
  getCategoryBySlug,
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  getBestSellers,
  getSimilarProducts,
} from "../controllers/catalogController"

const router = Router()

// Category endpoints
router.get("/categories/navbar", getNavbarCategories)
router.get("/categories/home", getHomeCategories)
router.get("/categories", getCategories)
router.get("/categories/:slug", getCategoryBySlug)

// Product endpoints
router.get("/products", getProducts)
router.get("/products/featured", getFeaturedProducts)
router.get("/products/bestsellers", getBestSellers)
router.get("/products/similar", getSimilarProducts)
router.get("/products/:slug", getProductBySlug)

export default router
