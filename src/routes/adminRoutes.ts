import { Router } from "express"
import {
  getDashboardStats,
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminGetCustomers,
  adminGetBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
} from "../controllers/adminController"
import { protect, authorize } from "../middlewares/authMiddleware"

const router = Router()

router.use(protect, authorize("admin", "superadmin"))

// Dashboard
router.get("/dashboard", getDashboardStats)

// Categories
router.get("/categories", adminGetCategories)
router.post("/categories", adminCreateCategory)
router.put("/categories/:id", adminUpdateCategory)
router.delete("/categories/:id", adminDeleteCategory)

// Products
router.get("/products", adminGetProducts)
router.post("/products", adminCreateProduct)
router.put("/products/:id", adminUpdateProduct)
router.delete("/products/:id", adminDeleteProduct)

// Customers
router.get("/customers", adminGetCustomers)

// Banners
router.get("/banners", adminGetBanners)
router.post("/banners", adminCreateBanner)
router.put("/banners/:id", adminUpdateBanner)
router.delete("/banners/:id", adminDeleteBanner)

export default router
