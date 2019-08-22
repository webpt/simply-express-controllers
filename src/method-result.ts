export class ResultBuilder {
  body: any;

  statusCode: number = 200;
  headers: Record<string, string> = {};
  cookies: Record<string, ResultBuilderCookie> = {};

  constructor(body: any) {
    this.body = body;
  }

  /**
   * Sets the status message of the result.
   * @param status The status code to return.
   */
  status(status: number): ResultBuilder {
    this.statusCode = status;
    return this;
  }

  /**
   * Sets a result header.
   * @param name The name of the header to set.
   * @param value The value of the header to set.
   */
  header(name: string, value: string): ResultBuilder {
    this.headers[name] = value;
    return this;
  }

  /**
   * Sets a cookie on the result.
   * @param name The name of the cookie.
   * @param value The value of the cookie.
   * @param settings Additional cookie settings.
   */
  cookie(
    name: string,
    value: string,
    settings?: CookieSettings
  ): ResultBuilder {
    this.cookies[name] = { value, ...(settings || {}) };
    return this;
  }
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

export interface ResultBuilderCookie extends CookieSettings {
  value: string;
}

/**
 * Utility function to assist in building controller results.
 * @param body The body data to return as the result.
 */
export function result(body: any): ResultBuilder {
  return new ResultBuilder(body);
}
