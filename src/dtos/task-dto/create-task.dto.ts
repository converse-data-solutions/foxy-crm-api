import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';
import { EntityName, TaskType, TaskPriority } from 'src/enums/core-app.enum';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task name',
    example: 'Follow up with client',
  })
  @IsString()
  @IsNotEmpty()
  @Sanitize()
  name: string;

  @ApiProperty({
    enum: EntityName,
    example: EntityName.Deal,
  })
  @IsEnum(EntityName)
  entityName: EntityName;

  @ApiProperty({
    example: '7e6c5c49-b5c2-46fb-8f7e-23f7a6d2dcd1',
  })
  @IsUUID('4', { message: 'Entity ID should be a UUID' })
  entityId: string;

  @ApiProperty({
    enum: TaskType,
    example: TaskType.Call,
  })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiPropertyOptional({
    enum: TaskPriority,
    example: TaskPriority.High,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({})
  @IsDefined({ message: 'Assigned to is required' })
  @IsUUID('4', { message: 'Assigned to should be a UUID' })
  assignedTo: string;
}
