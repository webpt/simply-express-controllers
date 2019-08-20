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

  /**
   * Sets a cookie on the result.
   * @param name The name of the cookie.
   * @param value The value of the cookie.
   * @param settings Additional cookie settings.
   */
  cookie(name: string, value: string, settings?: CookieSettings): ResultBuilder;
}

/**
 * Configuration options for setting cookies.
 *
 * Values inherited from express api.
 */
export interface CookieSettings {
  /**
   * Sets the domain of the cookie.  Defaults to the app's domain name.
   */
  domain?: string;

  /**
   * Expiry date of the cookie in GMT. If not specified or set to 0, creates a session cookie.
   */
  expires?: Date | boolean;

  /**
   * Flags the cookie to be accessible only by the web server.
   */
  httpOnly?: boolean;

  /**
   * Convenient option for setting the expiry time relative to the current time in milliseconds.
   */
  maxAge?: number;

  /**
   * Path for the cookie. Defaults to “/”.
   */
  path?: string;

  /**
   * Marks the cookie to be used with HTTPS only.
   */
  secure?: boolean;

  /**
   * Indicates if the cookie should be signed.
   */
  signed?: boolean;

  /**
   * Value of the “SameSite” Set-Cookie attribute.
   * More information at https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00#section-4.1.1.
   */
  sameSite?: boolean | string;
}

/**
 * Symbol for specifying a status code for a controller method result.
 */
export const StatusCode = Symbol("status-code");

/**
 * Symbol for specifying headers for a controller method result.
 */
export const Headers = Symbol("headers");

/**
 * Symbol for specifying cookies for a controller method result.
 */
export const Cookies = Symbol("cookies");

export interface ControllerMethodResult {
  [StatusCode]: number;
  [Headers]: Record<string, string>;
  [Cookies]: Record<string, ControllerMethodResultCookie>;
  [key: string]: any;
}

export interface ControllerMethodResultCookie extends CookieSettings {
  value: string;
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
    header: resultBuilderHeader,
    cookie: resultBuilderCookie
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

function resultBuilderCookie(
  this: any,
  name: string,
  value: string,
  settings?: CookieSettings
) {
  return attachResultBuilder({
    ...this,
    [Cookies]: {
      ...(this[Cookies] || {}),
      [name]: { value, ...(settings || {}) }
    }
  });
}
