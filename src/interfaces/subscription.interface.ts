import { UserCount } from 'src/enums/user-count.enum';

export interface SubscriptionInterface {
  planName: string;
  price: number;
  priceId: string;
  userCount: UserCount;
  validUpto: string;
}
