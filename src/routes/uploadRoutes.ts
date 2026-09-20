import { Router, Request, Response, NextFunction } from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { ApiResponse } from "../api/ApiResponse"
import { ApiError } from "../api/ApiError"

const router = Router()

const uploadDir = path.join(__dirname, "../../public/uploads")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, unique)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 60 * 1024 * 1024 }, // 60MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|svg|gif|pdf|mp4|webm|mov|quicktime/
    const mimetype =
      /image\/(jpeg|jpg|png|webp|svg\+xml|gif)|application\/pdf|video\/(mp4|webm|quicktime)/.test(
        file.mimetype
      )
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    if (mimetype || extname) {
      return cb(null, true)
    }
    cb(new Error("Only image, video (MP4/WebM), and PDF files are allowed"))
  },
})

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  upload.single("image")(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new ApiError(400, "File is too large. Maximum allowed size is 60MB."))
      }
      return next(new ApiError(400, `Upload error: ${err.message}`))
    } else if (err) {
      return next(new ApiError(400, err.message || "File upload failed"))
    }

    if (!req.file) {
      return next(new ApiError(400, "Please upload a file"))
    }

    const fileUrl = `/uploads/${req.file.filename}`
    res
      .status(201)
      .json(
        ApiResponse.success(
          { url: fileUrl, filename: req.file.filename, size: req.file.size },
          "File uploaded successfully"
        )
      )
  })
})

export default router
