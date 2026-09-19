import { Router } from "express"
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getProductReviews,
  createReview,
} from "../controllers/userController"
import { protect } from "../middlewares/authMiddleware"

const router = Router()

// Addresses (protected)
router.get("/addresses", protect, getAddresses)
router.post("/addresses", protect, createAddress)
router.put("/addresses/:id", protect, updateAddress)
router.delete("/addresses/:id", protect, deleteAddress)

// Reviews
router.get("/reviews/:productId", getProductReviews)
router.post("/reviews", protect, createReview)

export default router
