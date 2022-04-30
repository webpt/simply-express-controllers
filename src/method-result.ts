export interface ResultOptions {
  raw?: boolean;
}

export class ResultBuilder {
  handled: boolean = false;

  contentType: string | undefined;
  body: any;
  raw: boolean = false;

  statusCode: number = 200;
  headers: Record<string, string> = {};
  cookies: Record<string, ResultBuilderCookie> = {};

  constructor(body: any, contentType: string | undefined, opts: ResultOptions) {
    this.contentType = contentType;
    this.body = body;
    this.raw = opts.raw ?? false;

    this.handled = this.body === undefined;
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
  expires?: Date;

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
  sameSite?: boolean | "lax" | "strict" | "none";
}

export interface ResultBuilderCookie extends CookieSettings {
  value: string;
}

export interface ResultFactory {
  /**
   * Return a value indicating that the controller sent a response and no further action is needed.
   */
  handled(): ResultBuilder;

  /**
   * Creates a result containing json data.
   * The body object will be stringified as json data.
   */
  json(body: any): ResultBuilder;

  /**
   * Creates a result containing json data.
   * If the raw option is not set, the body will be stringified as json data.
   */
  json(opts: ResultOptions, body: any): ResultBuilder;

  /**
   * Creates a result containing text data.
   */
  text(body: string): ResultBuilder;

  /**
   * Creates a resutl containing html data.
   */
  html(body: string): ResultBuilder;

  /**
   * Sends a result as json data.
   * The body will be serialized as json, and a content type of "application/json" will be set if no other content type is specified.
   * @param body The json object body of the response.
   */
  (body: any): ResultBuilder;

  /**
   * Sends a result as json data.
   * The body will be serialized as json if the raw option is not set, and a content type of "application/json" will be set if no other content type is specified.
   * @param opts Options for body serialization.
   * @param body The json object body of the response.
   */
  (opts: ResultOptions, body: any): ResultBuilder;

  /**
   * Sends a result as the given content type.
   * If the content type is "application/json", the body will be serialized as json data.
   * The specified content type will be sent as the Content-Type header if not overridden.
   * @param contentType The content type to interpret the response by.  This can be overridden by a Content-Type header if the final content type should differ.
   * @param body The body of the response, if any is desired.
   */
  (contentType: string, body: any): ResultBuilder;

  /**
   * Sends a result as the given content type.
   * If the content type is "application/json" and the raw option is not set, the body will be serialized as json data.
   * The specified content type will be sent as the Content-Type header if not overridden.
   * @param contentType The content type to interpret the response by.  This can be overridden by a Content-Type header if the final content type should differ.
   * @param opts Additional options for the handling of the result.
   * @param body The body of the response, if any is desired.
   */
  (contentType: string, opts: ResultOptions, body: any): ResultBuilder;
}

const resultPartial: any = function result(...args: any[]): ResultBuilder {
  if (args.length === 3) {
    return new ResultBuilder(args[3], args[1], args[2]);
  }
  if (args.length === 2) {
    return new ResultBuilder(args[1], args[0], {});
  } else if (args.length === 1) {
    return new ResultBuilder(args[0], "application/json", {});
  }

  throw new Error("Unexpected argument count.");
};

resultPartial.handled = () => {
  return new ResultBuilder(undefined, undefined, {});
};

resultPartial.json = (...args: any[]) => {
  if (args.length === 2) {
    return new ResultBuilder(args[1], "application/json", args[0]);
  } else if (args.length === 1) {
    return new ResultBuilder(args[0], "application/json", {});
  }

  throw new Error("Unexpected argument count.");
};

resultPartial.text = (body: string) => {
  return new ResultBuilder(body, "text/plain", {});
};

resultPartial.html = (body: string) => {
  return new ResultBuilder(body, "text/html", {});
};

/**
 * Utility function to assist in building controller results.
 * @param body The body data to return as the result.
 */
export const result: ResultFactory = resultPartial;
