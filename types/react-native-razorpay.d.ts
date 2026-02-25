declare module "react-native-razorpay" {
  export interface RazorpayOptions {
    description?: string;
    image?: string;
    currency: string;
    key: string;
    amount: number;
    name: string;
    order_id?: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
    notes?: Record<string, string>;
  }

  export interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature: string;
  }

  export default class RazorpayCheckout {
    static open(options: RazorpayOptions): Promise<RazorpayResponse>;
  }
}
