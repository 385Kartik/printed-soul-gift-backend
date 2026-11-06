import { Router, Request, Response } from "express"
import mongoose from "mongoose"
import { Banner } from "../models/Banner"
import { ApiResponse } from "../api/ApiResponse"
import { asyncHandler } from "../api/asyncHandler"
import { catalogStore } from "../utils/catalogStore"

const router = Router()

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    if (mongoose.connection.readyState === 1) {
      try {
        const banners = await Banner.find({ isActive: true }).sort("order")
        if (banners && banners.length > 0) {
          return res.json(ApiResponse.success(banners, "Banners retrieved"))
        }

        const seedBanners = catalogStore.getBanners()
        if (seedBanners && seedBanners.length > 0) {
          try {
            await Banner.insertMany(seedBanners)
            const seeded = await Banner.find({ isActive: true }).sort("order")
            return res.json(ApiResponse.success(seeded, "Banners retrieved"))
          } catch (seedErr: any) {
            console.error("Auto-seed banners in storefront failed:", seedErr.message)
          }
        }
      } catch (e: any) {
        console.error("Storefront bannerRoutes error:", e.message)
      }
    }

    const fallbackBanners = catalogStore
      .getBanners()
      .filter((b: any) => b.isActive !== false)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

    res.json(ApiResponse.success(fallbackBanners, "Banners retrieved"))
  })
)

export default router
