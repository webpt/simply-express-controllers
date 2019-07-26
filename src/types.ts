export interface Controller {
  constructor: Function;
  prototype: Function;
}

export type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
