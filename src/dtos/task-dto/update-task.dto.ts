import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from 'src/enums/status.enum';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['entityId', 'entityName', 'name']),
) {
  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.Completed })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
