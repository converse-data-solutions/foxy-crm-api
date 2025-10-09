import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from 'src/enums/status.enum';
import { CreateTaskDto } from './create-task.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.Completed })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
