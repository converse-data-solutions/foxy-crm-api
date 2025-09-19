export class APIResponse<T=unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  pageInfo?: Pageination;
}

export class Pageination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
