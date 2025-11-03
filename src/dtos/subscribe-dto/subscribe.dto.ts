import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsUUID } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class SubscribeDto {
  @IsDefined({ message: 'Plan Id is required' })
  @IsUUID('4', { message: 'Plan id should be a uuid' })
  @ApiProperty({ example: '7217143b-05d7-420c-b604-9dbed245b24a' })
  @Sanitize()
  planId: string;
}
