import { Router, Request, Response } from "express"
import { Banner } from "../models/Banner"
import { ApiResponse } from "../api/ApiResponse"
import { asyncHandler } from "../api/asyncHandler"

const router = Router()

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const banners = await Banner.find({ isActive: true }).sort("order")
    res.json(ApiResponse.success(banners, "Banners retrieved"))
  })
)

export default router
