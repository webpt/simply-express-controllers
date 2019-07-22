export interface ResultBuilder {
  /**
   * Sets the status message of the result.
   * @param status The status code to return.
   * @param statusMessage The status message to return.
   */
  status(status: number, statusMessage?: string): ResultBuilder;

  /**
   * Sets a result header.
   * @param name The name of the header to set.
   * @param value The value of the header to set.
   */
  header(name: string, value: string): ResultBuilder;
}

/**
 * Symbol for specifying a status code for a controller method result.
 */
export const StatusCode = Symbol("status-code");

/**
 * Symbol for specifying headers for a controller method result.
 */
export const Headers = Symbol("headers");

export interface ControllerMethodResult {
  [StatusCode]: number;
  [Headers]: Record<string, string>;
  [key: string]: any;
}

/**
 * Utility function to assist in building controller results.
 * @param body The body data to return as the result.
 */
export function result(body: any): ResultBuilder {
  return attachResultBuilder(body) as any;
}

function attachResultBuilder(body: any) {
  const newBody = Object.create({
    status: resultBuilderStatus,
    header: resultBuilderHeader
  });
  Object.assign(newBody, body);
  return newBody;
}

function resultBuilderStatus(this: object, status: number) {
  return attachResultBuilder({
    ...this,
    [StatusCode]: status
  });
}

function resultBuilderHeader(this: any, name: string, value: string) {
  return attachResultBuilder({
    ...this,
    [Headers]: {
      ...(this[Headers] || {}),
      [name]: value
    }
  });
}
