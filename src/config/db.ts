import mongoose from "mongoose"
import { logger } from "../utils/logger"

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/printed_soul_gift")
    logger.info(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error: any) {
    logger.error(`MongoDB connection error: ${error.message}`)
    process.exit(1)
  }
}
