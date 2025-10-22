export interface RazorpayPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    subscription?: {
      entity: {
        id: string;
        entity: 'subscription';
        plan_id: string;
        customer_id: string;
        status: string;
        current_start: number;
        current_end: number;
        start_at: number;
        end_at: number;
        charge_at: number;
        total_count: number;
        paid_count: number;
        remaining_count: number;
        customer_notify: boolean;
        created_at: number;
        payment_method?: string;
      };
    };
    payment?: {
      entity: {
        id: string;
        entity: 'payment';
        amount: number;
        currency: string;
        status: string;
        order_id?: string;
        invoice_id?: string | null;
        international: boolean;
        method: string;
        captured: boolean;
        description?: string;
        card_id?: string;
        bank?: string;
        wallet?: string;
        vpa?: string;
        email?: string;
        contact?: string;
        created_at: number;
      };
    };
  };
  created_at: number;
}
