import { ISendMailOptions } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('mail-queue') private readonly mailQueue: Queue) {}

  async sendMail(mailOption: ISendMailOptions) {
    await this.mailQueue.add('mail-queue', mailOption);
  }
}
