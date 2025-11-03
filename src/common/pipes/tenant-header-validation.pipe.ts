import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate, version } from 'uuid';

@Injectable()
export class TenantHeaderValidationPipe implements PipeTransform {
  transform(value?: string) {
    if (!value) {
      throw new BadRequestException('Missing tenant identifier in headers.');
    }

    if (!validate(value) || version(value) !== 4) {
      throw new BadRequestException('Invalid tenant identifier format.');
    }

    return value;
  }
}
