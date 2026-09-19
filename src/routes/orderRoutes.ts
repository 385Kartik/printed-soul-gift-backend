import { Router } from "express"
import {
  createOrder,
  handlePayuCallback,
  trackOrder,
  getMyOrders,
  getMyOrderById,
  cancelOrder,
  downloadOrderInvoice,
  adminGetOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
  adminPushToDelhivery,
  adminProcessRefund,
} from "../controllers/orderController"
import { protect, authorize, optionalAuth } from "../middlewares/authMiddleware"

const router = Router()

// Public Tracking & PayU webhook
router.get("/track/:query", trackOrder)
router.get("/:id/invoice", downloadOrderInvoice)
router.post("/payu/callback", handlePayuCallback)

// Customer Orders (Guest or Logged in)
router.post("/", optionalAuth, createOrder)
router.get("/my", protect, getMyOrders)
router.get("/my/:id", protect, getMyOrderById)
router.put("/my/:id/cancel", protect, cancelOrder)

// Admin Order & Refund Endpoints
router.get("/admin/all", protect, authorize("admin", "superadmin"), adminGetOrders)
router.get("/admin/:id", protect, authorize("admin", "superadmin"), adminGetOrderById)
router.put("/admin/:id/status", protect, authorize("admin", "superadmin"), adminUpdateOrderStatus)
router.post("/admin/:id/delhivery", protect, authorize("admin", "superadmin"), adminPushToDelhivery)
router.post("/admin/:id/refund", protect, authorize("admin", "superadmin"), adminProcessRefund)

export default router
