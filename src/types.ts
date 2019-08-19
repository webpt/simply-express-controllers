export interface Controller {
  constructor: Function;
  prototype: Function;
}

export type Method = "GET" | "HEAD" | "POST" | "PATCH" | "PUT" | "DELETE";
