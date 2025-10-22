import { Controller, HttpCode, Post, Headers, Req } from '@nestjs/common';
import { RazorpayService } from '../services/razorpay.service';
import { Public } from 'src/common/decorators/public.decorator';
import { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('razorpay')
export class RazorpayController {
  constructor(private readonly razorpayService: RazorpayService) {}
  @Post('webhook')
  @SkipThrottle()
  @Public()
  @HttpCode(200)
  async handleWebhook(@Req() req: Request, @Headers('x-razorpay-signature') signature: string) {
    const rawBody = req.body.toString() as string;
    await this.razorpayService.handleWebhook(rawBody, signature);
  }
}
