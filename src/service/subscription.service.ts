import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { APIResponse } from 'src/common/dto/response.dto';
import { Subscription } from 'src/database/entity/base-app/subscription.entity';
import { SubscribeDto } from 'src/dto/subscribe-dto/subscribe.dto';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @Inject('STRIPE_CLIENT') private stripe: Stripe,
  ) {}

  async getSession(sessionId: string) {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }
  async create(subscribe: SubscribeDto, token: string | undefined): Promise<APIResponse> {
    if (!token) {
      throw new UnauthorizedException({ message: 'There is no token in cookie please login' });
    }
    const payload = await this.validateToken(token);
    const subscription = await this.subscriptionRepo.findOne({ where: { id: subscribe.id } });
    if (!subscription) {
      throw new BadRequestException({ message: 'Invalid subscription id' });
    }
    const session = await this.createCheckoutSession(payload.email, subscription.priceId);
    return {
      success: true,
      statusCode: HttpStatus.ACCEPTED,
      message: 'Payment link is retrived successfully',
      paymentUrl: session.url,
    };
  }

  async findAll(request: Request): Promise<APIResponse<Subscription[]>> {
    const token: string | undefined = request?.cookies['tenant_access_token'];
    if (!token) {
      throw new UnauthorizedException({ message: 'There is no token in cookie please login' });
    }
    const payload = await this.validateToken(token);
    const subscriptions = await this.subscriptionRepo.find();

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Fetched subscription plans',
      data: subscriptions,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} subscription`;
  }

  private async validateToken(token: string) {
    const verifyToken = await this.jwtService.verifyAsync(token, {
      secret: process.env.SECRET_KEY,
    });
    return verifyToken;
  }

  private async createCheckoutSession(customerEmail: string, priceId: string) {
    return await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:8000/api/v1/stripe/session?id={CHECKOUT_SESSION_ID}', //front end success url
      cancel_url: 'http://localhost:8000/cancel', //front end cancel url
    });
  }
}
