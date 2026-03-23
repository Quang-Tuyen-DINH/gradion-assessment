import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsNotFuture(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsNotFuture',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return true; // let @IsDateString handle format
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const date = new Date(value);
          date.setHours(0, 0, 0, 0);
          return date <= today;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not be a future date`;
        },
      },
    });
  };
}
