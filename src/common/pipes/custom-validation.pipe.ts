import { Injectable, BadRequestException, ValidationPipe, ValidationError } from '@nestjs/common';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  private readonly myExceptionFactory: (errors: ValidationError[]) => BadRequestException;

  constructor() {
    const formatErrors = (errors: ValidationError[]): Record<string, any> => {
      return errors.reduce((acc, error) => {
        const constraints = error.constraints || {};
        let formatError: any = {};

        if (constraints.isNumber) {
          formatError = Object.values(constraints.isNumber).join('');
        } else if (constraints.isString) {
          formatError = Object.values(constraints.isString).join('');
        } else if (constraints.isInt) {
          formatError = Object.values(constraints.isInt).join('');
        } else if (constraints.isDate) {
          formatError = Object.values(constraints.isDate).join('');
        } else if (constraints.isEmail) {
          formatError = Object.values(constraints.isEmail).join('');
        } else if (constraints.isPhoneNumber) {
          formatError = Object.values(constraints.isPhoneNumber).join('');
        } else if (constraints.isNotEmpty) {
          formatError = Object.values(constraints.isNotEmpty).join('');
        } else if (constraints.isBoolean) {
          formatError = Object.values(constraints.isBoolean).join('');
        } else if (constraints.isArray) {
          formatError = Object.values(constraints.isArray).join('');
        } else if (constraints.minLength) {
          formatError = Object.values(constraints.minLength).join('');
        } else if (constraints.maxLength) {
          formatError = Object.values(constraints.maxLength).join('');
        } else if (constraints.min) {
          formatError = Object.values(constraints.min).join('');
        } else if (constraints.max) {
          formatError = Object.values(constraints.max).join('');
        } else if (constraints.isAfterTimeFrom) {
          formatError = Object.values(constraints.isAfterTimeFrom).join('');
        } else if (constraints.isIp) {
          formatError = Object.values(constraints.isIp).join('');
        } else if (constraints.isDateString) {
          formatError = Object.values(constraints.isDateString).join('');
        } else if (constraints.validate) {
          formatError = Object.values(constraints.validate).join('');
        } else if (constraints.isEnum) {
          formatError = Object.values(constraints.isEnum).join('');
        } else if (constraints.matches) {
          formatError = Object.values(constraints.matches).join('');
        } else if (Object.keys(constraints).length > 0) {
          formatError = Object.values(constraints);
        }

        // Recursively handle nested children
        if (error.children && error.children.length > 0) {
          const childErrors = formatErrors(error.children);
          formatError = { ...(formatError || {}), ...childErrors };
        }

        acc[error.property] = formatError;
        return acc;
      }, {});
    };

    const exceptionFactory = (errors: ValidationError[]) => {
      const formattedErrors = formatErrors(errors);
      return new BadRequestException({
        success: false,
        statusCode: 400,
        message: [formattedErrors],
        error: 'Validation Error',
      });
    };

    super({ exceptionFactory });
    this.myExceptionFactory = exceptionFactory;
  }

  handleErrors(error: ValidationError[]) {
    throw this.myExceptionFactory(error);
  }
}
