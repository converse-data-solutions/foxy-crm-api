import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageDto } from '../page-dto/page.dto';
import { IsOptional, IsString } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class GetAccountDto extends PageDto {
  @ApiPropertyOptional({
    example: 'Abc Data Solutions',
  })
  @IsOptional()
  @IsString({ message: 'Name must be string' })
  @Sanitize()
  name: string;

  @ApiPropertyOptional({
    example: 'Artificial Intelligence',
  })
  @IsOptional()
  @IsString({ message: 'Industry must be string type' })
  @Sanitize()
  industry: string;

  @ApiPropertyOptional({
    example: 'San Francisco',
  })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  @Sanitize()
  city?: string;

  @ApiPropertyOptional({
    example: 'United States',
  })
  @IsOptional()
  @IsString({ message: 'Country must be string type' })
  @Sanitize()
  country?: string;
}
