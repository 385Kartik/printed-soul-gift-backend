import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { User } from "../models/User"
import { ApiError } from "../api/ApiError"
import { ApiResponse } from "../api/ApiResponse"
import { asyncHandler } from "../api/asyncHandler"
import { emailService } from "../services/emailService"

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "printed_soul_gift_secret", {
    expiresIn: "30d",
  })
}

const formatUserResponse = (user: any, token: string) => {
  const userObj = user.toObject ? user.toObject() : { ...user }
  delete userObj.password
  delete userObj.otp
  delete userObj.otpExpires
  return {
    ...userObj,
    user: userObj,
    token,
  }
}

// ── 1. Password Login ──
export const loginWithPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) return next(new ApiError(400, "Please provide email and password"))

  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user || !user.password) {
    return next(new ApiError(401, "Invalid email or password"))
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    return next(new ApiError(401, "Invalid email or password"))
  }

  const token = generateToken(user._id.toString(), user.role)
  res.json(ApiResponse.success(formatUserResponse(user, token), "Logged in successfully", { token }))
})

// ── 2. Send Login OTP ──
export const sendLoginOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body
  if (!email) return next(new ApiError(400, "Please provide email"))

  const cleanEmail = email.toLowerCase().trim()
  let user = await User.findOne({ email: cleanEmail })

  if (!user) {
    // Create new user automatically if not registered
    user = await User.create({
      name: cleanEmail.split("@")[0],
      email: cleanEmail,
      isVerified: false,
    })
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  user.otp = otp
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
  await user.save()

  await emailService.sendOtp(cleanEmail, otp)

  res.json(ApiResponse.success({ email: cleanEmail }, "OTP sent to your email"))
})

// ── 3. Verify Login OTP ──
export const verifyLoginOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body
  if (!email || !otp) return next(new ApiError(400, "Please provide email and OTP"))

  const cleanEmail = email.toLowerCase().trim()
  const user = await User.findOne({ email: cleanEmail })

  if (!user || !user.otp || !user.otpExpires) {
    return next(new ApiError(400, "Invalid OTP request. Please request a new code."))
  }

  if (user.otpExpires < new Date()) {
    return next(new ApiError(400, "OTP has expired. Please request a new one."))
  }

  if (user.otp !== otp.trim()) {
    return next(new ApiError(400, "Invalid verification code"))
  }

  user.otp = undefined
  user.otpExpires = undefined
  user.isVerified = true
  await user.save()

  const token = generateToken(user._id.toString(), user.role)
  res.json(ApiResponse.success(formatUserResponse(user, token), "Logged in successfully", { token }))
})

// ── 4. Send Signup OTP ──
export const sendSignupOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, phone, password } = req.body
  if (!name || !email || !password) {
    return next(new ApiError(400, "Name, email, and password are required"))
  }

  const cleanEmail = email.toLowerCase().trim()
  const existing = await User.findOne({ email: cleanEmail })
  if (existing && existing.isVerified && existing.password) {
    return next(new ApiError(400, "Account already exists with this email. Please sign in."))
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  if (existing) {
    existing.name = name
    existing.phone = phone
    existing.password = password
    existing.otp = otp
    existing.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
    await existing.save()
  } else {
    await User.create({
      name,
      email: cleanEmail,
      phone,
      password,
      otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
      isVerified: false,
    })
  }

  await emailService.sendSignupOtp(cleanEmail, otp)

  res.json(ApiResponse.success({ email: cleanEmail }, "Verification code sent to your email"))
})

// ── 5. Verify Signup OTP ──
export const verifySignupOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body
  if (!email || !otp) return next(new ApiError(400, "Email and OTP are required"))

  const cleanEmail = email.toLowerCase().trim()
  const user = await User.findOne({ email: cleanEmail })

  if (!user || !user.otp || !user.otpExpires) {
    return next(new ApiError(400, "Invalid verification request"))
  }

  if (user.otpExpires < new Date()) {
    return next(new ApiError(400, "OTP has expired"))
  }

  if (user.otp !== otp.trim()) {
    return next(new ApiError(400, "Invalid code"))
  }

  user.otp = undefined
  user.otpExpires = undefined
  user.isVerified = true
  await user.save()

  const token = generateToken(user._id.toString(), user.role)
  res.json(ApiResponse.success(formatUserResponse(user, token), "Account created successfully", { token }))
})

// ── 6. Get Current User (Me) ──
export const getMe = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user.id).select("-password")
  if (!user) return next(new ApiError(404, "User not found"))
  res.json(ApiResponse.success(user, "Profile retrieved"))
})

// ── 7. Update Profile ──
export const updateMe = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { name, phone } = req.body
  const user = await User.findById(req.user.id)
  if (!user) return next(new ApiError(404, "User not found"))

  if (name) user.name = name.trim()
  if (phone) user.phone = phone.trim()
  await user.save()

  res.json(ApiResponse.success(user, "Profile updated"))
})

// ── 8. Forgot Password ──
export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body
  if (!email) return next(new ApiError(400, "Please provide email"))

  const cleanEmail = email.toLowerCase().trim()
  const user = await User.findOne({ email: cleanEmail })
  if (!user) {
    // For security, respond success even if email not found
    return res.json(ApiResponse.success(null, "If an account exists, a reset code was sent."))
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  user.otp = otp
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
  await user.save()

  await emailService.sendOtp(cleanEmail, otp)

  res.json(ApiResponse.success({ email: cleanEmail }, "Password reset code sent to email"))
})
