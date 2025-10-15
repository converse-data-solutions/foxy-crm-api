import { ApiPropertyOptional, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from 'src/enums/status.enum';
import { CreateTaskDto } from './create-task.dto';
import { PageDto } from '../page-dto/page.dto';

export class GetTaskDto extends IntersectionType(
  PartialType(OmitType(CreateTaskDto, ['entityId', 'entityName'] as const)),
  PageDto,
) {
  @ApiPropertyOptional({
    enum: TaskStatus,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
