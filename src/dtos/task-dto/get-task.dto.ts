import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from 'src/enums/status.enum';
import { PageDto } from '../page-dto/page.dto';
import { TaskPriority, TaskType } from 'src/enums/core-app.enum';
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

  @ApiPropertyOptional({
    description: 'Sort tasks by status ASC or DESC',
    example: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'status must be ASC or DESC' })
  status?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Sort tasks by priority ASC or DESC',
    example: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'priority must be ASC or DESC' })
  priority?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Sort tasks by type ASC or DESC',
    example: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'type must be ASC or DESC' })
  type?: 'ASC' | 'DESC';
}
