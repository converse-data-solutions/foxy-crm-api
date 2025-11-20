import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageDto } from '../page-dto/page.dto';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class GetTaskDto extends PageDto {
  @ApiPropertyOptional({
    description: 'Task name',
    example: 'Follow up with client',
  })
  @IsOptional()
  @IsString()
  @Sanitize()
  name: string;

  @ApiPropertyOptional({ description: 'User name', example: 'John' })
  @IsOptional()
  @IsString()
  @Sanitize()
  assignedTo: string;
}
