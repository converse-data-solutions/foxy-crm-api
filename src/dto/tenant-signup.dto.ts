import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class TenantSignupDto {
  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'Abc Tech' })
  organizationName: string;

  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'john' })
  userName: string;

  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'pa$$w0rd' })
  password: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'http://www.abctech.in' })
  url?: string;
}
