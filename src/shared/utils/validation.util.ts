import { BadRequestException } from '@nestjs/common';

export function isValidSchemaName(schemaName: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(schemaName);
}

export function sanitizeSchemaName(schemaName: string): string {
  if (!schemaName) {
    throw new BadRequestException('Schema name is required');
  }

  if (!isValidSchemaName(schemaName)) {
    throw new BadRequestException(`Invalid schema name: ${schemaName}`);
  }

  const safeSchema = schemaName.replace(/[^0-9a-f-]/gi, '');
  if (safeSchema !== schemaName) {
    throw new BadRequestException(`Schema name contains invalid characters`);
  }

  return safeSchema;
}
