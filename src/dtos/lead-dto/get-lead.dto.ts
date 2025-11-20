import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageDto } from '../page-dto/page.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class LeadQueryDto extends PageDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @ApiPropertyOptional({ example: 'sam' })
  @Sanitize()
  name: string;

  @IsOptional()
  @IsString({ message: 'Email must be a string' })
  @ApiPropertyOptional({ example: 'sam@gmail.com' })
  @Sanitize()
  email: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @ApiPropertyOptional({ example: '9876532458' })
  @Sanitize()
  phone: string;

  @IsOptional()
  @IsString({ message: 'Company name must be a string' })
  @ApiPropertyOptional({ example: 'XYZ Tech Corp' })
  @Sanitize()
  company?: string;

  @ApiPropertyOptional({
    description: 'Sort leads by source ASC or DESC',
    example: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'source must be ASC or DESC' })
  source?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Sort leads by status ASC or DESC',
    example: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'status must be ASC or DESC' })
  status?: 'ASC' | 'DESC';
}
