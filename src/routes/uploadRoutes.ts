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
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|svg|pdf/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error("Only image and PDF files are allowed"))
  },
})

router.post("/", upload.single("image"), (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new ApiError(400, "Please upload a file"))
  }

  const fileUrl = `/uploads/${req.file.filename}`
  res.status(201).json(ApiResponse.success({ url: fileUrl, filename: req.file.filename }, "File uploaded successfully"))
})

export default router
