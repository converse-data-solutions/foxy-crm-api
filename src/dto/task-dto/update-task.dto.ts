import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EntityName, TaskType, TaskPriority } from 'src/enum/core-app.enum';
import { TaskStatus } from 'src/enum/status.enum';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Follow up with client' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: EntityName, example: EntityName.Deal })
  @IsOptional()
  @IsEnum(EntityName)
  entityName?: EntityName;

  @ApiPropertyOptional({ example: '7e6c5c49-b5c2-46fb-8f7e-23f7a6d2dcd1' })
  @IsOptional()
  @IsUUID('4', { message: 'Entity id is a valid uuid' })
  entityId?: string;

  @ApiPropertyOptional({ enum: TaskType, example: TaskType.Call })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.Completed })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.High })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '7e6c5c49-b5c2-46fb-8f7e-23f7a6d2dcd1' })
  @IsOptional()
  @IsUUID('4', { message: 'Assigned to should be a UUID' })
  assignedTo?: string;
}
