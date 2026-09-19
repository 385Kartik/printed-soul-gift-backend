export class ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
  meta?: any

  constructor(success: boolean, message: string, data: T, meta?: any) {
    this.success = success
    this.message = message
    this.data = data
    if (meta) this.meta = meta
  }

  static success<T>(data: T, message = "Success", meta?: any): ApiResponse<T> {
    return new ApiResponse(true, message, data, meta)
  }

  static error(message = "Error", data: any = null, meta?: any): ApiResponse {
    return new ApiResponse(false, message, data, meta)
  }
}
