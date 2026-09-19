import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { User } from "../models/User"
import { Category } from "../models/Category"
import { Product } from "../models/Product"
import { Banner } from "../models/Banner"

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

  // 2. Clear old categories & products if seeding fresh
  await Category.deleteMany({})
  await Product.deleteMany({})
  await Banner.deleteMany({})

  // 3. Seed Giftana-style Categories
  const categoriesData = [
    {
      name: "Personalized Gifts",
      slug: "personalized-gifts",
      description: "Custom engraved and printed gifts crafted uniquely for your loved ones",
      image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80",
      showOnNavbar: true,
      navDisplayName: "Personalized Gifts",
      showOnHome: true,
      homeOrder: 1,
      sortOrder: 1,
    },
    {
      name: "Diwali & Festive Gifts",
      slug: "diwali-gifts",
      description: "Traditional and modern festive gift hampers with diyas, sweets and dry fruits",
      image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=500&auto=format&fit=crop&q=80",
      showOnNavbar: true,
      navDisplayName: "Diwali Gifts",
      showOnHome: true,
      homeOrder: 2,
      sortOrder: 2,
    },
    {
      name: "Birthday Gifts",
      slug: "birthday-gifts",
      description: "Make birthdays extra special with personalized keepsakes, lamps and combos",
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80",
      showOnNavbar: true,
      navDisplayName: "Birthday Gifts",
      showOnHome: true,
      homeOrder: 3,
      sortOrder: 3,
    },
    {
      name: "Gift Hampers",
      slug: "gift-hampers",
      description: "Luxurious curated hampers featuring gourmet treats, gadgets and aromas",
      image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80",
      showOnNavbar: true,
      navDisplayName: "Gift Hampers",
      showOnHome: true,
      homeOrder: 4,
      sortOrder: 4,
    },
    {
      name: "Eco-Friendly Gifts",
      slug: "eco-friendly-gifts",
      description: "Sustainable bamboo notebooks, planters, organic treats and earth-friendly picks",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop&q=80",
      showOnNavbar: true,
      navDisplayName: "Eco-Friendly Gifts",
      showOnHome: true,
      homeOrder: 5,
      sortOrder: 5,
    },
    {
      name: "Bulk Corporate Gifts",
      slug: "corporate-gifts",
      description: "Premium employee joining kits, executive hampers, brand merchandise & giveaways",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=80",
      showOnNavbar: true,
      navDisplayName: "Bulk Corporate Gifts",
      showOnHome: true,
      homeOrder: 6,
      sortOrder: 6,
    },
    {
      name: "Employee Welcome Kits",
      slug: "employee-welcome-kits",
      description: "Professional onboarding kits with custom branded diary, pen, flask & bag",
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=80",
      showOnNavbar: false,
      navDisplayName: "Welcome Kits",
      showOnHome: true,
      homeOrder: 7,
      sortOrder: 7,
    },
    {
      name: "Gifts For Her",
      slug: "gifts-for-her",
      description: "Curated jewelry boxes, custom lamps, self-care kits & aesthetic presents",
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=80",
      showOnNavbar: false,
      navDisplayName: "Gifts For Her",
      showOnHome: true,
      homeOrder: 8,
      sortOrder: 8,
    },
    {
      name: "Gifts For Him",
      slug: "gifts-for-him",
      description: "Leather organizer sets, personalized flasks, executive laptop sleeves & grooming",
      image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&auto=format&fit=crop&q=80",
      showOnNavbar: false,
      navDisplayName: "Gifts For Him",
      showOnHome: true,
      homeOrder: 9,
      sortOrder: 9,
    },
  ]

  const insertedCats = await Category.insertMany(categoriesData)
  console.log(`✅ Seeded ${insertedCats.length} categories`)

  const getCatId = (slug: string) => insertedCats.find((c) => c.slug === slug)?._id

  // 4. Seed Products
  const productsData = [
    {
      name: "Festive Corporate Gifts - Shubh Aangan Hamper With Wireless Speaker & Dry Fruits",
      slug: "shubh-aangan-hamper",
      description: "Grand festive gift box containing a premium Bluetooth speaker, assorted premium California almonds, cashews, aromatic brass diyas, and festive greeting card.",
      price: 1799,
      comparePrice: 2299,
      images: [
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("diwali-gifts"),
      stock: 45,
      isFeatured: true,
      isBestSeller: true,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Diwali", "Festive", "Corporate"],
      recipient: ["Employees", "Clients", "Family"],
      tags: ["Diwali", "Hamper", "Speaker", "Dry Fruits"],
      ratings: { average: 4.9, count: 48 },
    },
    {
      name: "Premium Diwali Gifts - Grand Laxmi Ganesh Charan Hamper With Dry Fruits & Sweets",
      slug: "grand-laxmi-ganesh-hamper",
      description: "Bless your clients and loved ones with gold-plated Laxmi Ganesh idols, silver-finish dry fruit bowls, premium pistachio & raisins in a rigid royal blue gift box.",
      price: 2299,
      comparePrice: 2999,
      images: [
        "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("diwali-gifts"),
      stock: 30,
      isFeatured: true,
      isBestSeller: true,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Diwali", "Housewarming"],
      recipient: ["Family", "Clients"],
      tags: ["Diwali", "Gold Plated", "Laxmi Ganesh", "Traditional"],
      ratings: { average: 5.0, count: 32 },
    },
    {
      name: "Diwali Business Gifts - Grey Laptop Bag Set With Planner, Bottle & Pen",
      slug: "diwali-business-laptop-bag-set",
      description: "Sophisticated executive set including water-resistant vegan leather laptop messenger bag, 750ml thermal temperature flask, faux leather daily planner, and metal rollerball pen.",
      price: 2799,
      comparePrice: 3599,
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("corporate-gifts"),
      stock: 50,
      isFeatured: true,
      isBestSeller: true,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Corporate", "Welcome Kit", "Diwali"],
      recipient: ["Employees", "Executives", "Him"],
      tags: ["Laptop Bag", "Corporate Set", "Engraved"],
      ratings: { average: 4.8, count: 64 },
    },
    {
      name: "Personalized 4-in-1 Executive Corporate Gift Combo With Matte Black Flask & Diary",
      slug: "personalized-4-in-1-executive-combo",
      description: "Our top seller 4-in-1 combo: laser-engraved 500ml vacuum insulated bottle, A5 PU leather executive notebook with bookmark, metal cardholder, and matte black pen.",
      price: 999,
      comparePrice: 1499,
      images: [
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("personalized-gifts"),
      stock: 120,
      isFeatured: true,
      isBestSeller: true,
      isPersonalizable: true,
      personalizationPrompt: "Enter Full Name to Engrave on Bottle & Diary",
      allowCustomImageUpload: true,
      giftOccasions: ["Birthday", "Anniversary", "Corporate", "Joining"],
      recipient: ["Him", "Her", "Colleagues"],
      tags: ["Combo", "Personalized", "Flask", "Notebook"],
      ratings: { average: 4.9, count: 182 },
    },
    {
      name: "Custom Star Sky Acrylic Lamp With Wooden Base & Warm LED",
      slug: "custom-star-sky-acrylic-lamp",
      description: "Glowing personalized acrylic night lamp engraved with special names, date and message on high optical clarity 5mm acrylic with polished beech wood base.",
      price: 899,
      comparePrice: 1499,
      images: [
        "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("birthday-gifts"),
      stock: 80,
      isFeatured: true,
      isBestSeller: true,
      isPersonalizable: true,
      personalizationPrompt: "Enter Name(s) and Special Date to engrave",
      allowCustomImageUpload: true,
      giftOccasions: ["Birthday", "Anniversary", "Valentine"],
      recipient: ["Her", "Couples", "Kids"],
      tags: ["Lamp", "Acrylic", "Glowing", "Personalized"],
      ratings: { average: 4.9, count: 114 },
    },
    {
      name: "Elegant Velvet Mini Travel Jewelry Organizer Box With Custom Name",
      slug: "elegant-mini-jewelry-box",
      description: "Plush emerald green velvet jewelry case with multiple compartments for rings, earrings and necklaces. Custom gold foil embossed name on top.",
      price: 549,
      comparePrice: 699,
      images: [
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("gifts-for-her"),
      stock: 65,
      isFeatured: false,
      isBestSeller: true,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Birthday", "Valentine", "Bridesmaid"],
      recipient: ["Her", "Sister", "Wife"],
      tags: ["Jewelry Box", "Velvet", "Gifts for Her"],
      ratings: { average: 4.7, count: 42 },
    },
    {
      name: "Eco-Friendly Bamboo Notebook & Metal Flask Sustainable Hamper",
      slug: "eco-friendly-bamboo-hamper",
      description: "100% natural bamboo spiral notebook with recycled seed paper pen, bamboo thermal sipper, and mini cork desk organizer in eco-kraft packaging.",
      price: 999,
      comparePrice: 1699,
      images: [
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("eco-friendly-gifts"),
      stock: 90,
      isFeatured: false,
      isBestSeller: true,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Corporate", "Eco Event", "Teacher"],
      recipient: ["All", "Eco Lovers"],
      tags: ["Eco", "Bamboo", "Sustainable", "Hamper"],
      ratings: { average: 4.8, count: 39 },
    },
    {
      name: "Vintage Wooden Perpetual Desk Calendar With Pen Stand & Clock",
      slug: "wooden-perpetual-calendar-stand",
      description: "Handcrafted natural mahogany wood desktop organizer featuring perpetual date blocks, analog quartz clock, phone docking groove, and custom engraved plaque.",
      price: 599,
      comparePrice: 999,
      images: [
        "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("personalized-gifts"),
      stock: 75,
      isFeatured: false,
      isBestSeller: false,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Birthday", "Father's Day", "Corporate"],
      recipient: ["Him", "Father", "Colleague"],
      tags: ["Desk", "Clock", "Wooden", "Calendar"],
      ratings: { average: 4.8, count: 53 },
    },
    {
      name: "Royal Amber Dry Fruit Gift Box (Almonds, Cashews, Walnuts & Pistachios)",
      slug: "royal-amber-dry-fruit-gift-box",
      description: "Opulent golden magnetic gift box packed with 800g of Jumbo California Almonds, Goan W240 Cashews, Kashmiri Walnuts, and Roasted Salted Pistachios.",
      price: 1499,
      comparePrice: 1999,
      images: [
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("diwali-gifts"),
      stock: 60,
      isFeatured: true,
      isBestSeller: true,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Diwali", "Wedding", "Festive"],
      recipient: ["Family", "Clients", "All"],
      tags: ["Dry Fruits", "Diwali", "Hamper", "Luxury"],
      ratings: { average: 4.9, count: 72 },
    },
    {
      name: "Golden Brass Diya & Scented Candle Festive Pooja Set",
      slug: "golden-brass-diya-pooja-set",
      description: "Artisan-crafted dual peacock brass diyas paired with 4 hand-poured soy wax fragrance tea lights in a festive marigold gift box.",
      price: 699,
      comparePrice: 1199,
      images: [
        "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("diwali-gifts"),
      stock: 100,
      isFeatured: false,
      isBestSeller: true,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Diwali", "Pooja", "Housewarming"],
      recipient: ["Family", "Parents", "Friends"],
      tags: ["Brass Diya", "Pooja", "Diwali"],
      ratings: { average: 4.9, count: 41 },
    },
    {
      name: "Personalized Temperature LED Vacuum Flask (500ml) with Name Laser Engraving",
      slug: "personalized-temperature-led-flask",
      description: "Touch LED temperature display insulated water bottle with dual-wall stainless steel vacuum. Permanently engraved with recipient's name or corporate logo.",
      price: 499,
      comparePrice: 999,
      images: [
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("personalized-gifts"),
      stock: 150,
      isFeatured: true,
      isBestSeller: true,
      isPersonalizable: true,
      allowCustomImageUpload: false,
      giftOccasions: ["Birthday", "Gym", "Corporate", "Friend"],
      recipient: ["Him", "Her", "Friends"],
      tags: ["Flask", "Temperature", "Engraved", "Custom"],
      ratings: { average: 4.8, count: 119 },
    },
    {
      name: "Custom Wooden Engraved Photo Plaque (Stand & Wall Mount)",
      slug: "custom-wooden-engraved-photo-plaque",
      description: "Capture memorable moments on solid beechwood with laser photo burn and personal loving message. Comes with sturdy wooden easel display.",
      price: 799,
      comparePrice: 1299,
      images: [
        "https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("personalized-gifts"),
      stock: 80,
      isFeatured: false,
      isBestSeller: true,
      isPersonalizable: true,
      allowCustomImageUpload: true,
      giftOccasions: ["Anniversary", "Birthday", "Valentine"],
      recipient: ["Couple", "Her", "Him"],
      tags: ["Wood Engraving", "Photo Frame", "Memory"],
      ratings: { average: 5.0, count: 64 },
    },
    {
      name: "Personalized Genuine Leather Men's Wallet & Keychain Gift Set",
      slug: "personalized-leather-wallet-keychain-set",
      description: "Crafted from top-grain pull-up brown leather with RFID blocking slots, metallic name charm, and matching leather loop keychain.",
      price: 849,
      comparePrice: 1399,
      images: [
        "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("gifts-for-him"),
      stock: 95,
      isFeatured: true,
      isBestSeller: true,
      isPersonalizable: true,
      allowCustomImageUpload: false,
      giftOccasions: ["Birthday", "Anniversary", "Father's Day"],
      recipient: ["Him", "Husband", "Brother", "Father"],
      tags: ["Wallet", "Leather", "RFID", "Keychain"],
      ratings: { average: 4.8, count: 88 },
    },
    {
      name: "Bespoke Couple Name 3D Illusion Night Lamp with 7-Color LED",
      slug: "bespoke-couple-3d-illusion-night-lamp",
      description: "Romantic acrylic lamp engraved with couple names and infinity symbol. 7 color changing glow options with touch-sensitive wooden base.",
      price: 749,
      comparePrice: 1199,
      images: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("birthday-gifts"),
      stock: 110,
      isFeatured: true,
      isBestSeller: true,
      isPersonalizable: true,
      allowCustomImageUpload: false,
      giftOccasions: ["Anniversary", "Valentine", "Wedding"],
      recipient: ["Couple", "Her", "Wife"],
      tags: ["Lamp", "Couple", "Infinity", "Romantic"],
      ratings: { average: 4.9, count: 95 },
    },
    {
      name: "Executive Branded Onboarding Hamper with Metal Pen & Diary",
      slug: "executive-branded-onboarding-hamper",
      description: "All-in-one corporate welcome package featuring A5 hardbound dotted journal, matte ballpoint pen, 16GB USB drive, and sleek coffee mug.",
      price: 1199,
      comparePrice: 1699,
      images: [
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("corporate-gifts"),
      stock: 85,
      isFeatured: false,
      isBestSeller: true,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Corporate", "Onboarding", "Conference"],
      recipient: ["Employees", "Clients"],
      tags: ["Corporate Kit", "Diary", "Pen", "Welcome"],
      ratings: { average: 4.7, count: 37 },
    },
    {
      name: "Luxury Aroma Diffuser & Essential Oils Relaxation Hamper",
      slug: "luxury-aroma-diffuser-hamper",
      description: "Ultrasonic 300ml ceramic grain aroma diffuser with LED mood lighting and trio of pure lavender, eucalyptus & lemongrass essential oils.",
      price: 1399,
      comparePrice: 1899,
      images: [
        "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("gift-hampers"),
      stock: 40,
      isFeatured: false,
      isBestSeller: false,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Self Care", "Birthday", "Housewarming"],
      recipient: ["Her", "Mom", "Colleague"],
      tags: ["Diffuser", "Aroma", "Relaxation", "Wellness"],
      ratings: { average: 4.9, count: 28 },
    },
    {
      name: "Artisan Handmade Chocolate Box with Assorted Truffles (Pack of 12)",
      slug: "artisan-handmade-chocolate-box-12",
      description: "Decadent box of 12 Belgian dark, milk & white chocolate truffles with roasted hazelnuts, sea salt caramel, and espresso fillings.",
      price: 599,
      comparePrice: 899,
      images: [
        "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("gift-hampers"),
      stock: 130,
      isFeatured: false,
      isBestSeller: true,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Birthday", "Diwali", "Anniversary"],
      recipient: ["All", "Kids", "Chocolate Lovers"],
      tags: ["Chocolates", "Truffles", "Sweets"],
      ratings: { average: 4.9, count: 83 },
    },
    {
      name: "Botanical Scented Soy Wax Candle Trio Gift Set",
      slug: "botanical-scented-candle-trio",
      description: "Set of three frosted glass scented candles made from 100% natural soy wax with crackling wood wicks: Vanilla Amber, Fresh Jasmine, and Sandalwood.",
      price: 649,
      comparePrice: 999,
      images: [
        "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("gifts-for-her"),
      stock: 70,
      isFeatured: false,
      isBestSeller: true,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Housewarming", "Birthday", "Festive"],
      recipient: ["Her", "Friends", "Home Lovers"],
      tags: ["Candles", "Soy Wax", "Fragrance"],
      ratings: { average: 4.8, count: 52 },
    },
    {
      name: "Vintage Brass Compass in Rosewood Case with Custom Engraving",
      slug: "vintage-brass-compass-rosewood-case",
      description: "Antique maritime directional magnetic compass crafted in solid polished brass, housed in a hinged rosewood box engraved with your personal message.",
      price: 899,
      comparePrice: 1499,
      images: [
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("personalized-gifts"),
      stock: 45,
      isFeatured: false,
      isBestSeller: false,
      isPersonalizable: true,
      allowCustomImageUpload: false,
      giftOccasions: ["Graduation", "Retirement", "Father's Day"],
      recipient: ["Him", "Mentor", "Father"],
      tags: ["Compass", "Vintage", "Brass", "Keepsake"],
      ratings: { average: 4.9, count: 34 },
    },
    {
      name: "Handcrafted Kashmiri Saffron & Organic Forest Honey Gift Hamper",
      slug: "kashmiri-saffron-forest-honey-hamper",
      description: "Pure Mongra grade A1 Kashmiri saffron (1g) with raw wild forest honey (250g) and wooden dipper in an exquisite royal gift box.",
      price: 1199,
      comparePrice: 1699,
      images: [
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("gift-hampers"),
      stock: 55,
      isFeatured: true,
      isBestSeller: true,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Diwali", "Wedding", "Corporate"],
      recipient: ["Family", "Clients", "Grandparents"],
      tags: ["Saffron", "Honey", "Organic", "Festive"],
      ratings: { average: 5.0, count: 46 },
    },
    {
      name: "Premium Stainless Steel Insulated Tumbler with Straw & Handle (800ml)",
      slug: "stainless-steel-insulated-tumbler-800ml",
      description: "Trending large-capacity insulated hydration travel mug with ergonomic handle, leak-proof 2-in-1 sip/straw lid, keeps drinks cold for 24 hours.",
      price: 899,
      comparePrice: 1499,
      images: [
        "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80"
      ],
      category: getCatId("eco-friendly-gifts"),
      stock: 80,
      isFeatured: false,
      isBestSeller: true,
      isPersonalizable: false,
      allowCustomImageUpload: false,
      giftOccasions: ["Fitness", "Office", "Birthday"],
      recipient: ["Her", "Him", "Colleague"],
      tags: ["Tumbler", "Travel Mug", "Steel", "Trending"],
      ratings: { average: 4.8, count: 67 },
    },
  ]

  const insertedProducts = await Product.insertMany(productsData)
  console.log(`✅ Seeded ${insertedProducts.length} gift products`)

  // 5. Seed Banners
  const bannersData = [
    {
      title: "Corporate Gifting Solutions That Build Stronger Connections",
      subtitle: "From employee welcome kits & branded merchandise to bespoke festive giveaways. Perfect for every occasion & budget.",
      tag: "Curated Corporate Gifts for Every Business Need",
      imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&auto=format&fit=crop&q=80",
      link: "/products?category=corporate-gifts",
      buttonText: "Explore Corporate Hampers",
      type: "hero",
      order: 1,
    },
    {
      title: "Handcrafted Personalized Gifts Made With Pure Love",
      subtitle: "Custom laser-engraved flasks, acrylic glowing frames, magic mugs & personalized hampers delivered across India.",
      tag: "Crafted Exclusively For Your Loved Ones",
      imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1600&auto=format&fit=crop&q=80",
      link: "/products?category=personalized-gifts",
      buttonText: "Shop Personalized Gifts",
      type: "hero",
      order: 2,
    },
  ]

  await Banner.insertMany(bannersData)
  console.log("✅ Seeded initial hero banners")

  console.log("🎉 Seeding completed successfully!")
  process.exit(0)
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err)
  process.exit(1)
})
