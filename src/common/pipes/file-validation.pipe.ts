import { BadRequestException, FileValidator } from '@nestjs/common';

export class FileValidationPipe extends FileValidator<Record<string, any>, Express.Multer.File> {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'text/plain',
  ];

  constructor(validationOptions?: Record<string, any>) {
    super(validationOptions || {});
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const isCsvExtension = file.originalname.toLowerCase().endsWith('.csv');
    if (!isCsvExtension) {
      throw new BadRequestException('Invalid file extension. Only .csv files are allowed.');
    }
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only CSV is allowed.');
    }
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File too large. Max allowed size is 5MB.');
    }
    return true;
  }

  buildErrorMessage(): string {
    return `Invalid file. Please upload a CSV file under 5MB size limit.`;
  }
}
