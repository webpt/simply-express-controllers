import { ValidateFunction } from "ajv";

export function getValidatorError(
  validator: ValidateFunction,
  defaultMessage: string
): string {
  if (!validator.errors) {
    return defaultMessage;
  }
  if (validator.errors.length == 0) {
    return defaultMessage;
  }
  if (!validator.errors[0].message) {
    return defaultMessage;
  }
  return validator.errors[0].message;
}
