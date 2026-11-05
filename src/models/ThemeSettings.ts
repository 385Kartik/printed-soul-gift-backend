import mongoose, { Schema, Document } from "mongoose"

export interface IThemeColors {
  primary: string
  background: string
  surface: string
  textPrimary: string
  textMuted: string
  borderColor: string
  goldAccent: string
}

export interface IThemeBanners {
  showHeadings: boolean
  fontFamily: string
  headingSize: "small" | "medium" | "large" | "xlarge"
  alignment: "left" | "center" | "right"
  position: "center" | "bottom-left" | "bottom-center" | "bottom-right"
  textColor: string
  showSubtitle: boolean
  showButton: boolean
}

export interface IThemeProducts {
  aspectRatio: "4:5" | "1:1" | "3:4" | "16:9"
  gridColumns: 2 | 3 | 4
  photoMode: "single" | "multi"
  hoverBehavior: "video" | "second_image" | "zoom" | "none"
  cardRadius: string
  showPrice: boolean
  showRating: boolean
}

export interface IThemeSettings extends Document {
  colors: IThemeColors
  banners: IThemeBanners
  products: IThemeProducts
}

const ThemeSettingsSchema = new Schema<IThemeSettings>(
  {
    colors: {
      primary: { type: String, default: "#DC2626" },
      background: { type: String, default: "#0A0204" },
      surface: { type: String, default: "#140507" },
      textPrimary: { type: String, default: "#FFFFFF" },
      textMuted: { type: String, default: "#A1A1AA" },
      borderColor: { type: String, default: "rgba(255, 255, 255, 0.08)" },
      goldAccent: { type: String, default: "#F59E0B" },
    },
    banners: {
      showHeadings: { type: Boolean, default: false },
      fontFamily: { type: String, default: "Playfair Display" },
      headingSize: { type: String, enum: ["small", "medium", "large", "xlarge"], default: "large" },
      alignment: { type: String, enum: ["left", "center", "right"], default: "center" },
      position: {
        type: String,
        enum: ["center", "bottom-left", "bottom-center", "bottom-right"],
        default: "center",
      },
      textColor: { type: String, default: "#FFFFFF" },
      showSubtitle: { type: Boolean, default: true },
      showButton: { type: Boolean, default: true },
    },
    products: {
      aspectRatio: { type: String, enum: ["4:5", "1:1", "3:4", "16:9"], default: "4:5" },
      gridColumns: { type: Number, enum: [2, 3, 4], default: 4 },
      photoMode: { type: String, enum: ["single", "multi"], default: "multi" },
      hoverBehavior: {
        type: String,
        enum: ["video", "second_image", "zoom", "none"],
        default: "video",
      },
      cardRadius: { type: String, default: "rounded-xl" },
      showPrice: { type: Boolean, default: true },
      showRating: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
)

export const ThemeSettings = mongoose.model<IThemeSettings>("ThemeSettings", ThemeSettingsSchema)
