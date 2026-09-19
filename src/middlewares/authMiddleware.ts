import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { User } from "../models/User"
import { ApiError } from "../api/ApiError"

export interface AuthRequest extends Request {
  user?: any
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token
  }

  if (!token) {
    return next(new ApiError(401, "Not authorized — Please sign in"))
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "printed_soul_gift_secret")
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return next(new ApiError(401, "User belonging to token no longer exists"))
    }

    req.user = user
    next()
  } catch (err: any) {
    return next(new ApiError(401, "Invalid or expired authentication token"))
  }
}

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token
  }

  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "printed_soul_gift_secret")
      req.user = await User.findById(decoded.id).select("-password")
    } catch {
      // Ignored for optional
    }
  }
  next()
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action"))
    }
    next()
  }
}
