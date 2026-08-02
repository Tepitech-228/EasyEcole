import axios from 'axios'

export interface CinetpayPaymentRequest {
  transactionId: string
  amount: number
  currency?: string
  description: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  redirectUrl?: string
  cancelUrl?: string
  callbackUrl?: string
}

export interface CinetpayPaymentResponse {
  success: boolean
  message: string
  data?: {
    transactionId: string
    paymentUrl?: string
    status: string
    amount: number
    currency: string
  }
}

export interface CinetpayCheckResponse {
  success: boolean
  status: string
  amount?: number
  currency?: string
  paymentDate?: string
  operator?: string
}

export interface CinetpayRefundResponse {
  success: boolean
  message: string
  data?: {
    refundId: string
    status: string
  }
}

export class MobileMoneyCinetpay {
  private static instance: MobileMoneyCinetpay | null = null

  private apiKey: string
  private merchantId: string
  private baseUrl: string
  private initialized: boolean

  private constructor() {
    this.apiKey = process.env.CINETPAY_API_KEY || ''
    this.merchantId = process.env.CINETPAY_MERCHANT_ID || ''
    this.baseUrl = process.env.CINETPAY_BASE_URL || 'https://api.cinetpay.com/v1'
    this.initialized = false
  }

  static getInstance(): MobileMoneyCinetpay {
    if (!MobileMoneyCinetpay.instance) {
      MobileMoneyCinetpay.instance = new MobileMoneyCinetpay()
    }
    return MobileMoneyCinetpay.instance
  }

  init(): void {
    if (!this.apiKey || !this.merchantId) {
      console.warn('[Cinetpay] API key or merchant ID not configured. Mobile money payments will be disabled.')
      this.initialized = false
      return
    }
    this.initialized = true
    console.log('[Cinetpay] Initialisé avec succès')
  }

  isInitialized(): boolean {
    return this.initialized
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-KEY': this.apiKey,
    }
  }

  async createPayment(params: CinetpayPaymentRequest): Promise<CinetpayPaymentResponse> {
    if (!this.initialized) {
      return { success: false, message: 'Cinetpay non initialisé' }
    }

    try {
      const payload: any = {
        merchant_id: this.merchantId,
        transaction_id: params.transactionId,
        amount: params.amount,
        currency: params.currency || 'XOF',
        description: params.description,
      }

      if (params.customerName) payload.customer_name = params.customerName
      if (params.customerEmail) payload.customer_email = params.customerEmail
      if (params.customerPhone) payload.customer_phone = params.customerPhone
      if (params.redirectUrl) payload.redirect_url = params.redirectUrl
      if (params.cancelUrl) payload.cancel_url = params.cancelUrl
      if (params.callbackUrl) payload.callback_url = params.callbackUrl

      const response = await axios.post(`${this.baseUrl}/payment`, payload, {
        headers: this.getHeaders(),
        timeout: 15000,
      })

      const result = response.data
      if (result && result.success) {
        return {
          success: true,
          message: result.message || 'Paiement créé',
          data: {
            transactionId: params.transactionId,
            paymentUrl: result.payment_url || result.data?.payment_url,
            status: result.status || 'pending',
            amount: params.amount,
            currency: params.currency || 'XOF',
          },
        }
      }

      return {
        success: false,
        message: result?.message || 'Erreur lors de la création du paiement',
      }
    } catch (error: any) {
      console.error('[Cinetpay] Erreur createPayment:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur réseau',
      }
    }
  }

  async checkPayment(transactionId: string): Promise<CinetpayCheckResponse> {
    if (!this.initialized) {
      return { success: false, status: 'unavailable' }
    }

    try {
      const response = await axios.get(`${this.baseUrl}/payment/${transactionId}`, {
        headers: this.getHeaders(),
        timeout: 10000,
      })

      const result = response.data
      return {
        success: result?.success ?? false,
        status: result?.status || 'unknown',
        amount: result?.amount,
        currency: result?.currency,
        paymentDate: result?.payment_date,
        operator: result?.operator,
      }
    } catch (error: any) {
      console.error('[Cinetpay] Erreur checkPayment:', error.response?.data || error.message)
      return {
        success: false,
        status: 'error',
      }
    }
  }

  async refundPayment(transactionId: string, amount: number, currency = 'XOF'): Promise<CinetpayRefundResponse> {
    if (!this.initialized) {
      return { success: false, message: 'Cinetpay non initialisé' }
    }

    try {
      const payload = {
        merchant_id: this.merchantId,
        transaction_id: transactionId,
        amount,
        currency,
      }

      const response = await axios.post(`${this.baseUrl}/refund`, payload, {
        headers: this.getHeaders(),
        timeout: 15000,
      })

      const result = response.data
      return {
        success: result?.success ?? false,
        message: result?.message || 'Remboursement effectué',
        data: result?.data
          ? { refundId: result.data.refund_id || result.data.refundId, status: result.data.status }
          : undefined,
      }
    } catch (error: any) {
      console.error('[Cinetpay] Erreur refundPayment:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur réseau',
      }
    }
  }

  generateTransactionId(prefix = 'TXN'): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    return `${prefix}-${timestamp}-${random}`
  }
}
