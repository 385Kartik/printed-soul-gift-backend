import { Router, Request, Response } from "express"
import mongoose from "mongoose"
import { ThemeSettings } from "../models/ThemeSettings"
import { ApiResponse } from "../api/ApiResponse"
import { asyncHandler } from "../api/asyncHandler"
import { catalogStore } from "../utils/catalogStore"

const router = Router()

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    if (mongoose.connection.readyState === 1) {
      try {
        const theme = await ThemeSettings.findOne()
        if (theme) {
          return res.json(ApiResponse.success(theme, "Theme settings retrieved"))
        }
      } catch (e) {}
    }

    const theme = catalogStore.getThemeSettings()
    res.json(ApiResponse.success(theme, "Theme settings retrieved"))
  })
)

export default router
