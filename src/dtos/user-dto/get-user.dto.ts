import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/enums/core-app.enum';
import { StatusCause } from 'src/enums/status.enum';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';
import { PageDto } from '../page-dto/page.dto';

export class GetUserDto extends PageDto {
  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  @Sanitize()
  name: string;

  @ApiPropertyOptional({ example: 'navaneethan@conversedatasolutions.com' })
  @IsOptional()
  @IsString()
  @Sanitize()
  email: string;

  @ApiPropertyOptional({ example: '9876532458' })
  @IsOptional()
  @IsString()
  @Sanitize()
  phone: string;

  @IsOptional()
  @IsString({ message: 'City should be string' })
  @ApiPropertyOptional({ example: 'Gobi' })
  @Sanitize()
  city?: string;

  @IsOptional()
  @IsString({ message: 'Country should be string' })
  @ApiPropertyOptional({ example: 'India' })
  @Sanitize()
  country?: string;

  @ApiPropertyOptional({ description: 'Status of the user' })
  @IsOptional()
  @IsString()
  status?: boolean;

  @ApiPropertyOptional({
    description: 'Sort users by role ASC or DESC',
    example: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'role must be ASC or DESC' })
  role?: 'ASC' | 'DESC';
}
