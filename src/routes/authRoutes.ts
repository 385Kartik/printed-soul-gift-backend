import { Router } from "express"
import {
  loginWithPassword,
  sendLoginOtp,
  verifyLoginOtp,
  sendSignupOtp,
  verifySignupOtp,
  getMe,
  updateMe,
  forgotPassword,
} from "../controllers/authController"
import { protect } from "../middlewares/authMiddleware"

const router = Router()

router.post("/login/password", loginWithPassword)
router.post("/login/send-otp", sendLoginOtp)
router.post("/login/verify-otp", verifyLoginOtp)

router.post("/signup/send-otp", sendSignupOtp)
router.post("/signup/verify-otp", verifySignupOtp)

router.post("/forgot-password", forgotPassword)

router.get("/me", protect, getMe)
router.put("/me", protect, updateMe)

export default router
