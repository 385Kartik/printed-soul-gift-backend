import fs from "fs"
import path from "path"

function getSeedFilePath(): string {
  const candidates = [
    path.resolve(__dirname, "../data/seedProducts.json"),
    path.resolve(__dirname, "../../src/data/seedProducts.json"),
    path.resolve(process.cwd(), "src/data/seedProducts.json"),
    path.resolve(process.cwd(), "dist/data/seedProducts.json"),
    path.resolve(process.cwd(), "backend/src/data/seedProducts.json"),
    path.resolve(process.cwd(), "backend/dist/data/seedProducts.json"),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return path.resolve(__dirname, "../data/seedProducts.json")
}

interface SeedData {
  categories: any[]
  products: any[]
  banners?: any[]
  themeSettings?: any
}

function readData(): SeedData {
  const filePath = getSeedFilePath()
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8")
      const parsed = JSON.parse(raw)
      return {
        categories: parsed.categories || [],
        products: parsed.products || [],
        banners: parsed.banners || [],
        themeSettings: parsed.themeSettings || null,
      }
    }
  } catch (err) {
    console.error("Failed to read seedProducts.json from", filePath, err)
  }
  return { categories: [], products: [], banners: [], themeSettings: null }
}

function writeData(data: SeedData) {
  const filePath = getSeedFilePath()
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
  } catch (err) {
    console.error("Failed to write seedProducts.json to", filePath, err)
  }
}

export const catalogStore = {
  getCategories: () => {
    return readData().categories
  },

  getProducts: (params?: { category?: string; search?: string; isPersonalizable?: string | boolean }) => {
    const data = readData()
    let prods = data.products.map((p) => {
      const cat = data.categories.find((c) => c._id === p.category || c.slug === p.category)
      return {
        ...p,
        category: cat || { _id: p.category, name: "Curated Luxury", slug: "gift-hampers" },
      }
    })

    if (params?.category) {
      prods = prods.filter(
        (p) =>
          p.category?.slug === params.category ||
          p.category?._id === params.category ||
          p.category?.name?.toLowerCase().includes(String(params.category).toLowerCase())
      )
    }

    if (params?.search) {
      const term = String(params.search).toLowerCase()
      prods = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.tags?.some((t: string) => t.toLowerCase().includes(term))
      )
    }

    if (params?.isPersonalizable !== undefined) {
      const boolVal = String(params.isPersonalizable) === "true"
      prods = prods.filter((p) => !!p.isPersonalizable === boolVal)
    }

    return prods
  },

  getProductById: (id: string) => {
    const data = readData()
    const p = data.products.find((prod) => prod._id === id)
    if (!p) return null
    const cat = data.categories.find((c) => c._id === p.category)
    return { ...p, category: cat }
  },

  getProductBySlug: (slug: string) => {
    const data = readData()
    const p = data.products.find((prod) => prod.slug === slug)
    if (!p) return null
    const cat = data.categories.find((c) => c._id === p.category)
    return { ...p, category: cat }
  },

  createProduct: (productData: any) => {
    const data = readData()
    const newId = productData._id || `prod_${Date.now()}`
    const newProduct = {
      ...productData,
      _id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    data.products.unshift(newProduct)
    writeData(data)
    return newProduct
  },

  updateProduct: (id: string, updates: any) => {
    const data = readData()
    const idx = data.products.findIndex((p) => p._id === id)
    if (idx === -1) return null
    data.products[idx] = {
      ...data.products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData(data)
    return data.products[idx]
  },

  deleteProduct: (id: string) => {
    const data = readData()
    data.products = data.products.filter((p) => p._id !== id)
    writeData(data)
    return true
  },

  // ── Banners ──
  getBanners: () => {
    const data = readData()
    return (data.banners || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
  },

  getBannerById: (id: string) => {
    const data = readData()
    return (data.banners || []).find((b: any) => b._id === id) || null
  },

  createBanner: (bannerData: any) => {
    const data = readData()
    if (!data.banners) data.banners = []
    const newId = bannerData._id || `banner_${Date.now()}`
    const newBanner = {
      ...bannerData,
      _id: newId,
      mediaType: bannerData.mediaType || (bannerData.videoUrl ? "video" : "image"),
      size: bannerData.size || "auto",
      position: bannerData.position || "hero",
      order: bannerData.order !== undefined ? Number(bannerData.order) : data.banners.length + 1,
      isActive: bannerData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    data.banners.push(newBanner)
    writeData(data)
    return newBanner
  },

  updateBanner: (id: string, updates: any) => {
    const data = readData()
    if (!data.banners) data.banners = []
    const idx = data.banners.findIndex((b: any) => b._id === id)
    if (idx === -1) {
      // If doesn't exist, create it
      return catalogStore.createBanner({ ...updates, _id: id })
    }
    data.banners[idx] = {
      ...data.banners[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData(data)
    return data.banners[idx]
  },

  deleteBanner: (id: string) => {
    const data = readData()
    if (!data.banners) return true
    data.banners = data.banners.filter((b: any) => b._id !== id)
    writeData(data)
    return true
  },

  // ── Theme Settings ──
  getThemeSettings: () => {
    const data = readData()
    if (data.themeSettings) return data.themeSettings
    return {
      colors: {
        primary: "#DC2626",
        background: "#0A0204",
        surface: "#140507",
        textPrimary: "#FFFFFF",
        textMuted: "#A1A1AA",
        borderColor: "rgba(255, 255, 255, 0.08)",
        goldAccent: "#F59E0B",
      },
      banners: {
        showHeadings: false,
        fontFamily: "Playfair Display",
        headingSize: "large",
        alignment: "center",
        position: "center",
        textColor: "#FFFFFF",
        showSubtitle: true,
        showButton: true,
      },
      products: {
        aspectRatio: "4:5",
        gridColumns: 4,
        photoMode: "multi",
        hoverBehavior: "video",
        cardRadius: "rounded-xl",
        showPrice: true,
        showRating: true,
      },
    }
  },

  updateThemeSettings: (updates: any) => {
    const data = readData()
    const current = catalogStore.getThemeSettings()
    data.themeSettings = {
      ...current,
      ...updates,
      colors: { ...current.colors, ...(updates.colors || {}) },
      banners: { ...current.banners, ...(updates.banners || {}) },
      products: { ...current.products, ...(updates.products || {}) },
      updatedAt: new Date().toISOString(),
    }
    writeData(data)
    return data.themeSettings
  },
}
