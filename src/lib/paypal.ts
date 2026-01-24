/**
 * PayPal SDK Configuration
 * 
 * This module provides PayPal integration for FocusRobin
 * 
 * Required environment variables:
 * - PAYPAL_CLIENT_ID: Your PayPal Client ID
 * - PAYPAL_CLIENT_SECRET: Your PayPal Client Secret
 * - PAYPAL_MODE: 'sandbox' or 'live' (defaults to 'sandbox')
 */

// Validate environment variables
if (!process.env.PAYPAL_CLIENT_ID) {
  console.warn('Warning: PAYPAL_CLIENT_ID is not set in environment variables');
}

if (!process.env.PAYPAL_CLIENT_SECRET) {
  console.warn('Warning: PAYPAL_CLIENT_SECRET is not set in environment variables');
}

// PayPal API URLs
const PAYPAL_SANDBOX_URL = 'https://api-m.sandbox.paypal.com';
const PAYPAL_LIVE_URL = 'https://api-m.paypal.com';

export const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
export const PAYPAL_API_URL = PAYPAL_MODE === 'live' ? PAYPAL_LIVE_URL : PAYPAL_SANDBOX_URL;
export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
export const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

/**
 * Get PayPal Access Token
 * Uses client credentials to get an OAuth 2.0 access token
 */
export async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials are not configured');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[PayPal] Failed to get access token:', error);
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create PayPal Order
 * Creates an order that can be approved by the customer
 */
export interface PayPalOrderData {
  orderId: string;
  orderNumber: string;
  total: number;
  currency: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface PayPalCreateOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export async function createPayPalOrder(orderData: PayPalOrderData): Promise<PayPalCreateOrderResponse> {
  const accessToken = await getPayPalAccessToken();
  
  // Round to 2 decimal places
  const total = Math.round(orderData.total * 100) / 100;
  
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: orderData.orderId,
      description: orderData.description || `Order ${orderData.orderNumber}`,
      custom_id: orderData.orderNumber,
      amount: {
        currency_code: orderData.currency,
        value: total.toFixed(2),
      },
    }],
    application_context: {
      brand_name: 'FocusRobin',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: orderData.returnUrl || `${process.env.NEXT_PUBLIC_URL}/checkout/success`,
      cancel_url: orderData.cancelUrl || `${process.env.NEXT_PUBLIC_URL}/checkout?cancelled=true`,
    },
  };

  console.log('[PayPal] Creating order with payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `order-${orderData.orderId}-${Date.now()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[PayPal] Failed to create order:', error);
    throw new Error(`Failed to create PayPal order: ${error}`);
  }

  const data = await response.json();
  console.log('[PayPal] Order created successfully:', data.id);
  
  return data;
}

/**
 * Capture PayPal Order
 * Captures payment after customer approval
 */
export interface PayPalCaptureResponse {
  id: string;
  status: 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED' | 'FAILED';
  purchase_units: Array<{
    reference_id: string;
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
  payer: {
    email_address: string;
    payer_id: string;
    name: {
      given_name: string;
      surname: string;
    };
  };
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalCaptureResponse> {
  const accessToken = await getPayPalAccessToken();

  console.log('[PayPal] Capturing order:', paypalOrderId);

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[PayPal] Failed to capture order:', error);
    throw new Error(`Failed to capture PayPal order: ${error}`);
  }

  const data = await response.json();
  console.log('[PayPal] Order captured successfully:', data.id, 'Status:', data.status);
  
  return data;
}

/**
 * Get PayPal Order Details
 */
export async function getPayPalOrderDetails(paypalOrderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${paypalOrderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[PayPal] Failed to get order details:', error);
    throw new Error(`Failed to get PayPal order details: ${error}`);
  }

  return response.json();
}

/**
 * Verify PayPal Webhook Signature
 */
export async function verifyPayPalWebhook(
  headers: Record<string, string>,
  body: string,
  webhookId: string
): Promise<boolean> {
  const accessToken = await getPayPalAccessToken();

  const verifyPayload = {
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: webhookId,
    webhook_event: JSON.parse(body),
  };

  const response = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verifyPayload),
  });

  if (!response.ok) {
    console.error('[PayPal] Webhook verification failed');
    return false;
  }

  const data = await response.json();
  return data.verification_status === 'SUCCESS';
}

/**
 * Refund PayPal Capture
 */
export async function refundPayPalCapture(
  captureId: string,
  amount?: { currency_code: string; value: string }
): Promise<any> {
  const accessToken = await getPayPalAccessToken();

  const payload = amount ? { amount } : {};

  const response = await fetch(`${PAYPAL_API_URL}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[PayPal] Failed to refund capture:', error);
    throw new Error(`Failed to refund PayPal capture: ${error}`);
  }

  return response.json();
}

