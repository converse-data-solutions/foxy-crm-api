import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsInt, Min, Matches } from 'class-validator';
import { LeadSource } from 'src/enums/core-app.enum';

export class LeadQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[^\s@]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email address',
  })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\+?[0-9\- ]{7,20}$/, {
    message: 'Phone must be a valid number and may include country code',
  })
  phone?: string;

  @ApiPropertyOptional({
    enum: LeadSource,
  })
  @IsOptional()
  @IsEnum(LeadSource, {
    message: `Source must be a valid lead source (${Object.values(LeadSource).join(', ')})`,
  })
  source?: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Company name must be a string' })
  company?: string;

  @ApiPropertyOptional({
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page number must be an numeric value' })
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an numeric value' })
  @Min(1)
  limit?: number = 10;
}
