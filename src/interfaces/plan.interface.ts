import { UserCount } from 'src/enums/user-count.enum';

export interface PlanInterface {
  name: string;
  prices: {
    monthly: number;
    quarterly: number;
    halfYearly: number;
    yearly: number;
  };
  userCount: UserCount;
  apiCallsPerMinute: number;
}
