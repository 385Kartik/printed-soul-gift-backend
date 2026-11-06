import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/printed_soul_gift"

async function run() {
  console.log("Connecting to MongoDB:", MONGODB_URI)
  await mongoose.connect(MONGODB_URI)
  console.log("Connected successfully.")

  const db = mongoose.connection.db
  if (!db) {
    console.error("No DB connection")
    process.exit(1)
  }

  // 1. Read seedProducts.json
  const seedPathCandidates = [
    path.resolve(__dirname, "../data/seedProducts.json"),
    path.resolve(__dirname, "../../src/data/seedProducts.json"),
    path.resolve(process.cwd(), "src/data/seedProducts.json"),
    path.resolve(process.cwd(), "dist/data/seedProducts.json"),
  ]
  let seedPath = seedPathCandidates.find((p) => fs.existsSync(p))
  if (!seedPath) {
    console.error("seedProducts.json not found in candidates:", seedPathCandidates)
    process.exit(1)
  }

  console.log("Loading seed from:", seedPath)
  const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8"))

  // 2. Sync Categories
  const catCol = db.collection("categories")
  for (const cat of seedData.categories || []) {
    const existing = await catCol.findOne({ slug: cat.slug })
    if (!existing) {
      const catDoc = {
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        image: cat.image || "",
        showOnNavbar: cat.showOnNavbar !== false,
        navDisplayName: cat.navDisplayName || cat.name,
        showOnHome: cat.showOnHome !== false,
        homeOrder: cat.homeOrder || 1,
        sortOrder: cat.sortOrder || 1,
        parentCategory: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await catCol.insertOne(catDoc)
      console.log(`Created category: ${cat.name} (${cat.slug})`)
    }
  }

  // Build category slug -> ObjectId map
  const allCats = await catCol.find().toArray()
  const catMap = new Map<string, any>()
  for (const c of allCats) {
    catMap.set(c.slug, c._id)
    catMap.set(c._id.toString(), c._id)
    catMap.set(c.name.toLowerCase(), c._id)
  }

  // 3. Sync Banners
  const bannerCol = db.collection("banners")
  const bannerCount = await bannerCol.countDocuments()
  console.log(`Current MongoDB banners count: ${bannerCount}`)

  if (bannerCount === 0) {
    console.log("Seeding initial banners into MongoDB...")
    const bannersToInsert: any[] = []

    // Include the user's recently uploaded banners if files exist!
    const userBanner1 = "/uploads/1793908640619-153691256.jpg"
    const userBanner2 = "/uploads/1793908671108-978802710.jpg"

    bannersToInsert.push({
      _id: "banner_user_1",
      title: "VIP Executive Haute Collection",
      subtitle: "Bespoke gift boxes with handcrafted merchandise & personalization",
      tag: "Signature Selection",
      imageUrl: userBanner1,
      videoUrl: "",
      mediaType: "image",
      size: "full",
      position: "hero",
      link: "/products?category=gift-hampers",
      buttonText: "Explore Collection",
      type: "hero",
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    bannersToInsert.push({
      _id: "banner_user_2",
      title: "Artisanal Keepsakes & Corporate Suites",
      subtitle: "Designed for leaders, collectors, and unforgettable moments",
      tag: "Haute Edition",
      imageUrl: userBanner2,
      videoUrl: "",
      mediaType: "image",
      size: "full",
      position: "hero",
      link: "/products?category=corporate-gifts",
      buttonText: "Shop Hampers",
      type: "hero",
      order: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Also include standard catalog banners
    for (const b of seedData.banners || []) {
      bannersToInsert.push({
        _id: b._id || new mongoose.Types.ObjectId().toString(),
        title: b.title,
        subtitle: b.subtitle || "",
        tag: b.tag || "",
        imageUrl: b.imageUrl,
        videoUrl: b.videoUrl || "",
        mediaType: b.mediaType || "image",
        size: b.size || "auto",
        position: b.position || (b.type === "middle" ? "middle" : b.type === "bottom" ? "bottom" : "hero"),
        link: b.link || "/products",
        buttonText: b.buttonText || "Shop Now",
        type: b.type || "hero",
        order: (b.order || 0) + 2,
        isActive: b.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    await bannerCol.insertMany(bannersToInsert)
    console.log(`Inserted ${bannersToInsert.length} banners into MongoDB.`)
  }

  // 4. Sync 12 Luxury Products
  const prodCol = db.collection("products")
  for (const p of seedData.products || []) {
    const existing = await prodCol.findOne({ slug: p.slug })
    if (!existing) {
      let resolvedCatId = catMap.get(p.category)
      if (!resolvedCatId) {
        // Fallback to first available category
        resolvedCatId = allCats[0]?._id
      }

      const prodDoc = {
        name: p.name,
        slug: p.slug,
        description: p.description || "",
        price: Number(p.price || 0),
        comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
        images: Array.isArray(p.images) ? p.images : [],
        category: resolvedCatId,
        stock: p.stock || 100,
        isFeatured: p.isFeatured !== false,
        isBestSeller: p.isBestSeller !== false,
        isPersonalizable: !!p.isPersonalizable,
        personalizationPrompt: p.personalizationPrompt || "Enter Name or Custom Message",
        allowCustomImageUpload: !!p.allowCustomImageUpload,
        personalizationZones: Array.isArray(p.personalizationZones) ? p.personalizationZones : [],
        bulkPricingTiers: Array.isArray(p.bulkPricingTiers) ? p.bulkPricingTiers : [],
        customAddonsEnabled: !!p.customAddonsEnabled,
        applicableAddons: Array.isArray(p.applicableAddons) ? p.applicableAddons : [],
        hoverMediaType: p.hoverMediaType || "image",
        hoverMediaUrl: p.hoverMediaUrl || undefined,
        giftOccasions: Array.isArray(p.giftOccasions) ? p.giftOccasions : ["Corporate", "VIP", "Celebration"],
        recipient: Array.isArray(p.recipient) ? p.recipient : ["Executive", "Client", "Partner"],
        tags: Array.isArray(p.tags) ? p.tags : ["luxury", "gift"],
        ratings: { average: 4.95, count: 48 },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await prodCol.insertOne(prodDoc)
      console.log(`Seeded luxury product into MongoDB: ${p.name}`)
    }
  }

  // 5. Sync ThemeSettings
  const themeCol = db.collection("themesettings")
  const themeCount = await themeCol.countDocuments()
  if (themeCount === 0 && seedData.themeSettings) {
    await themeCol.insertOne({
      ...seedData.themeSettings,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    console.log("Seeded default ThemeSettings into MongoDB.")
  }

  console.log("Catalog sync completed successfully!")
  process.exit(0)
}

run().catch((err) => {
  console.error("Catalog sync error:", err)
  process.exit(1)
})
