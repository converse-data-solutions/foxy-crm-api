import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Role } from 'src/enums/core-app.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'navaneethan' })
  @IsOptional()
  @IsString({ message: 'User name must be a string' })
  @Length(5, 30, { message: 'User name must be between 5 and 30 characters' })
  name?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @Matches(/^[^\s@]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email address',
  })
  @Length(5, 50, { message: 'Email must be between 5 and 50 characters' })
  email?: string;

  @ApiPropertyOptional({ example: '9876532458' })
  @IsOptional()
  @Matches(/^\+?[0-9\- ]{7,20}$/, {
    message: 'Phone must be a valid number and may include country code',
  })
  @Length(5, 20, { message: 'Phone must be between 6 and 20 characters' })
  phone?: string;

  @ApiPropertyOptional({ example: 'pa$w0rd$' })
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @Length(7, 15, { message: 'Password must be between 7 and 15 characters' })
  password?: string;

  @ApiPropertyOptional({
    enum: Role,
    description: 'Role of the user',
    example: Role.SalesRep,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'role must be a valid enum value' })
  role?: Role;

  @ApiPropertyOptional({
    example: '3180 18th St',
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @Length(5, 50, { message: 'Address must be between 5 and 50 characters' })
  address?: string;

  @ApiPropertyOptional({
    example: 'San Francisco',
  })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  @Length(3, 40, { message: 'City must be between 3 and 40 characters' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'Country should be string' })
  @ApiPropertyOptional({ example: 'India' })
  country?: string;
}
