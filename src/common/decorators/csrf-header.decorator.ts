import { ApiHeader } from '@nestjs/swagger';

export const CsrfHeader = () =>
  ApiHeader({
    name: 'x-csrf-token',
    description: 'CSRF token (required for protected routes)',
    required: false,
  });
