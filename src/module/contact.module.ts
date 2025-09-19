import { Module } from '@nestjs/common';
import { ContactService } from '../service/contact.service';
import { ContactController } from '../controller/contact.controller';

@Module({
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
