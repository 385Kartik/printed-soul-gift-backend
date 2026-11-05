import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { User } from "../models/User"
import { Category } from "../models/Category"
import { Product } from "../models/Product"
import { Banner } from "../models/Banner"
import { Addon } from "../models/Addon"

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/printed_soul_gift")
  console.log("Connected to MongoDB for seeding...")

  // 1. Seed Admin
  const adminEmail = "admin@printedsoulgift.com"
  const existingAdmin = await User.findOne({ email: adminEmail })
  if (!existingAdmin) {
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: "Admin@Password123",
      role: "admin",
      isVerified: true,
      phone: "9876543210",
    })
    console.log("✅ Admin user created: admin@printedsoulgift.com / Admin@Password123")
  }

  // 2. Load Luxury Curated Catalog from seedProducts.json
  const seedFilePath = path.resolve(__dirname, "../data/seedProducts.json")
  const seedData = JSON.parse(fs.readFileSync(seedFilePath, "utf-8"))

  // 3. Clear old categories, products, addons & banners
  await Category.deleteMany({})
  await Product.deleteMany({})
  await Banner.deleteMany({})
  await Addon.deleteMany({})

  // 4. Insert Categories
  const insertedCats = await Category.insertMany(seedData.categories)
  console.log(`✅ Seeded ${insertedCats.length} categories`)

  // 5. Insert Products
  const insertedProducts = await Product.insertMany(seedData.products)
  console.log(`✅ Seeded ${insertedProducts.length} luxury products into MongoDB`)

  // 6. Seed High-Impact Banners
  const bannersData = [
    {
      title: "The Official Ferrari Gifting Collection",
      subtitle: "Curated hampers, merchandise and collectibles",
      buttonText: "Shop Gift Hampers",
      link: "/products?category=gift-hampers",
      image: "/hero-ferrari-hamper.jpg",
      position: "hero",
      order: 1,
      isActive: true,
    },
    {
      title: "Corporate Gifting That Drives Relationships",
      subtitle: "Premium executive gift hampers for VIP partners and teams",
      buttonText: "Get a Custom Quote",
      link: "/products?category=corporate-gifts",
      image: "/corporate-luxury-gifting.jpg",
      position: "middle",
      order: 2,
      isActive: true,
    },
    {
      title: "Bespoke Keepsakes & Legends Edition",
      subtitle: "Custom laser-engraved plaques, trophies & commemorative gifts",
      buttonText: "Explore Bespoke",
      link: "/products?category=personalized-gifts",
      image: "/hero-legends-hamper.jpg",
      position: "bottom",
      order: 3,
      isActive: true,
    },
  ]
  await Banner.insertMany(bannersData)
  console.log(`✅ Seeded ${bannersData.length} banners`)

  console.log("\n🎉 Seeding completed successfully!")
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error("❌ Seeding error:", err)
  process.exit(1)
})
