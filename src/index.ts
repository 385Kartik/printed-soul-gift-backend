import express, { Express, Request, Response } from "express"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(__dirname, "../.env") })

import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import rateLimit from "express-rate-limit"

import { connectDB } from "./config/db"
import { errorHandler } from "./middlewares/errorHandler"
import { logger } from "./utils/logger"

// Route imports
import authRoutes from "./routes/authRoutes"
import catalogRoutes from "./routes/catalogRoutes"
import orderRoutes from "./routes/orderRoutes"
import cartRoutes from "./routes/cartRoutes"
import userRoutes from "./routes/userRoutes"
import adminRoutes from "./routes/adminRoutes"
import bannerRoutes from "./routes/bannerRoutes"
import uploadRoutes from "./routes/uploadRoutes"

const app: Express = express()
const port = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

// ── Security & Headers ──
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

app.use(
  cors((req, callback) => {
    const allowed = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:3000",
      process.env.CLIENT_URL,
      process.env.ADMIN_URL,
    ].filter(Boolean) as string[]

    const origin = req.headers.origin as string

    // Allow PayU callback redirect (may send null origin from browser submit)
    if (req.path === "/api/orders/payu/callback") {
      return callback(null, { origin: true, credentials: true })
    }

    if (!origin || allowed.includes(origin)) {
      return callback(null, { origin: true, credentials: true })
    }

    return callback(null, { origin: false })
  })
)

// Rate Limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: "Too many requests. Please try again later." })
app.use("/api", limiter)

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 25, message: "Too many login/signup attempts" })
app.use("/api/auth/login", authLimiter)
app.use("/api/auth/signup", authLimiter)

// ── Body Parsers ──
app.use(express.json({ limit: "20mb" }))
app.use(express.urlencoded({ extended: true, limit: "20mb" }))
app.use(cookieParser())

// ── Logging ──
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined", { stream: { write: (msg) => logger.http(msg.trim()) } }))
}

// ── Static Files ──
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")))

// ── Health Check ──
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "Printed Soul Gift API", timestamp: new Date() })
})

// ── API Routes ──
app.use("/api/auth", authRoutes)
app.use("/api/catalog", catalogRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/user", userRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/banners", bannerRoutes)
app.use("/api/upload", uploadRoutes)

// ── Global Error Handler ──
app.use(errorHandler)

app.listen(port, () => {
  logger.info(`🚀 Printed Soul Gift API listening on port ${port}`)
})

export default app
