import { ValidateFunction } from "ajv";

export function getValidatorError(
  validator: ValidateFunction,
  defaultMessage: string,
  defaultProp: string = ""
): string {
  if (!validator.errors) {
    return defaultMessage;
  }
  if (validator.errors.length == 0) {
    return defaultMessage;
  }

  const error = validator.errors[0];
  if (!error.message) {
    return defaultMessage;
  }

  let prop = error.propertyName || defaultProp;
  if (prop && prop != "") {
    prop += " ";
  }
  return `${prop}${validator.errors[0].message}`;
}
