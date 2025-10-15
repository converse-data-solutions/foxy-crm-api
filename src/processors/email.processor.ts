import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('mail-queue')
export class EmailProcessor extends WorkerHost {
  constructor(private mailService: MailerService) {
    super();
  }
  async process(job: Job<ISendMailOptions>) {
    await this.mailService.sendMail(job.data);
  }
}
