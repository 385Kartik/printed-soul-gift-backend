import { Router } from "express"
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController"
import { protect } from "../middlewares/authMiddleware"

const router = Router()

router.use(protect)

router.get("/", getCart)
router.post("/add", addToCart)
router.put("/update", updateCartItem)
router.delete("/remove/:productId", removeFromCart)
router.delete("/clear", clearCart)

export default router
