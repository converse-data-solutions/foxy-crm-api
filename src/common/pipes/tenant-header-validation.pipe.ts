import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate, version } from 'uuid';

@Injectable()
export class TenantHeaderValidationPipe implements PipeTransform {
  transform(value?: string) {
    if (!value || !validate(value) || version(value) !== 4) {
      throw new BadRequestException('Invalid tenant id.');
    }
    return value;
  }
}
