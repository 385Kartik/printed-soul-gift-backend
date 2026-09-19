import axios from "axios"

const BASE_URL = process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com"
const TOKEN = process.env.DELHIVERY_TOKEN || ""
const PICKUP_NAME = process.env.DELHIVERY_PICKUP_LOCATION || "Printed_Soul_Warehouse"

function headers() {
  return {
    Authorization: `Token ${TOKEN}`,
    "Content-Type": "application/json",
  }
}

export const delhiveryService = {
  /**
   * Generate a Delhivery tracking URL for a given waybill number
   */
  generateTrackingUrl(awb: string): string {
    return `https://www.delhivery.com/track/package/${encodeURIComponent(awb.trim())}`
  },

  /**
   * Create a shipment on Delhivery One after payment.
   * Returns { success, awbCode, message }
   */
  async createShipment(order: any): Promise<{
    success: boolean
    awbCode?: string
    waybillId?: string
    message?: string
  }> {
    if (!TOKEN) {
      return { success: false, message: "DELHIVERY_TOKEN not set in .env" }
    }

    const addr = order.shippingAddress
    const rawPhone = String(addr.phone || "").replace(/\D/g, "")
    const cleanPhone = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone || "9999999999"
    const pincode = String(addr.pincode || "").replace(/\D/g, "")
    const totalWeight = Math.max(0.4, order.items.reduce((s: number, _: any) => s + 0.4, 0))

    const shipmentData = {
      shipments: [
        {
          name: addr.fullName || "Customer",
          add: addr.street || "Main Road",
          city: addr.city || "Mumbai",
          state: addr.state || "Maharashtra",
          country: addr.country || "India",
          pin: pincode,
          phone: cleanPhone,
          order: order.orderNumber,
          payment_mode: "Prepaid",
          return_pin: "",
          return_city: "",
          return_phone: "",
          return_name: "",
          return_add: "",
          return_state: "",
          return_country: "India",
          products_desc: order.items.map((i: any) => i.name).join(", ").substring(0, 100),
          hsn_code: "",
          cod_amount: 0,
          order_date: new Date(order.createdAt || Date.now()).toISOString().split("T")[0],
          total_amount: order.totalAmount,
          seller_add: "",
          seller_name: "Printed Soul Gift",
          seller_inv: order.orderNumber,
          quantity: order.items.reduce((s: number, i: any) => s + i.quantity, 0),
          waybill: "",
          shipment_width: 15,
          shipment_height: 10,
          weight: totalWeight,
          seller_gst_tin: process.env.DELHIVERY_GST || "",
          shipping_mode: "Surface",
          address_type: "home",
        },
      ],
      pickup_location: {
        name: PICKUP_NAME,
      },
    }

    try {
      const url = `${BASE_URL}/api/cmu/create.json`
      const body = `format=json&data=${encodeURIComponent(JSON.stringify(shipmentData))}`

      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Token ${TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 15000,
      })

      const resData = response.data
      if (resData.success === false || (resData.rmk && resData.rmk.toLowerCase().includes("fail"))) {
        return {
          success: false,
          message: resData.rmk || "Delhivery API reported failure",
        }
      }

      const packages = resData.packages || []
      if (packages.length > 0) {
        const pkg = packages[0]
        if (pkg.status === "Fail") {
          return { success: false, message: pkg.remarks?.[0] || "Package creation failed" }
        }
        const awb = pkg.waybill || pkg.awb
        return {
          success: true,
          awbCode: String(awb),
          waybillId: String(awb),
          message: "Shipment created successfully",
        }
      }

      return { success: false, message: "No package returned by Delhivery API" }
    } catch (err: any) {
      const msg = err.response?.data?.rmk || err.response?.data?.message || err.message
      return { success: false, message: `Delhivery API error: ${msg}` }
    }
  },

  /**
   * Track shipment via Delhivery One Tracking API
   */
  async trackShipment(waybill: string): Promise<{
    success: boolean
    status?: string
    scans?: any[]
    estimatedDelivery?: string
    message?: string
  }> {
    if (!TOKEN) {
      return { success: false, message: "DELHIVERY_TOKEN not configured" }
    }

    try {
      const response = await axios.get(
        `${BASE_URL}/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}`,
        { headers: headers(), timeout: 10000 }
      )

      const packageData = response.data?.ShipmentData?.[0]?.Shipment
      if (!packageData) {
        return { success: false, message: "Waybill not found on Delhivery" }
      }

      return {
        success: true,
        status: packageData.Status?.Status || "Unknown",
        scans: packageData.Scans || [],
        estimatedDelivery: packageData.ExpectedDeliveryDate,
      }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  },

  /**
   * Cancel shipment on Delhivery One
   */
  async cancelShipment(waybill: string): Promise<{ success: boolean; message: string }> {
    if (!TOKEN) {
      return { success: false, message: "DELHIVERY_TOKEN not configured" }
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/api/p/edit`,
        {
          waybill,
          cancellation: "true",
        },
        { headers: headers(), timeout: 10000 }
      )

      return {
        success: response.data?.status === "SUCCESS" || response.data?.success === true,
        message: response.data?.remarks || response.data?.message || "Shipment cancellation processed",
      }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  },
}
