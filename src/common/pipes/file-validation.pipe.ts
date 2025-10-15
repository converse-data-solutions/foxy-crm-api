import { FileValidator } from '@nestjs/common';

export class FileValidationPipe extends FileValidator<Record<string, any>, Express.Multer.File> {
  constructor(validationOptions?: Record<string, any>) {
    super(validationOptions || {});
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) return false;

    const isCsvExtension = file.originalname.toLowerCase().endsWith('.csv');
    const isCsvMime = file.mimetype === 'text/csv';

    return isCsvExtension && isCsvMime;
  }

  buildErrorMessage(): string {
    return 'Please upload CSV files only';
  }
}
