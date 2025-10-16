export class APIResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  pageInfo?: Pageination;
  paymentUrl?: string | null;
  otpFor?: OTPFor;
}
export type OTPFor = 'tenantSignup' | 'userSignup' | 'forgotPassword';
export class Pageination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
