import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageDto } from '../page-dto/page.dto';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class GetContactDto extends PageDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Sanitize()
  name: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsString()
  @Sanitize()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  @Sanitize()
  phone: string;
}
