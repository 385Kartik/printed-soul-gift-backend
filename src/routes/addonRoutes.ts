import { Router } from "express"
import {
  getAddonsForProduct,
  getAllAddons,
  createAddon,
  updateAddon,
  deleteAddon,
} from "../controllers/addonController"
import { protect, authorize } from "../middlewares/authMiddleware"

const router = Router()

// Public
router.get("/catalog/addons/product/:productId", getAddonsForProduct)

// Admin
router.get("/admin/addons", protect, authorize("admin", "superadmin"), getAllAddons)
router.post("/admin/addons", protect, authorize("admin", "superadmin"), createAddon)
router.put("/admin/addons/:id", protect, authorize("admin", "superadmin"), updateAddon)
router.delete("/admin/addons/:id", protect, authorize("admin", "superadmin"), deleteAddon)

export default router
