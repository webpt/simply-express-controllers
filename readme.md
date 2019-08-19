# soapdish-controllers

A simple express controller library. This library generates express routes and swagger docs from decorated controller classes.

## Design Philosophy

This library is designed to be narrowly focused on solving the creation of express controllers. As such, it does not do anything other than create routes and swagger path docs. The creation and configuration of the express app, and the chosen program architecture is entirely up to you.

## Usage

### Creating the controller

To create an express route, create a class that will represent a controller for the route. Decorate this class with `@controller`

```js
import { controller } from "soapdish-controllers";

// Path is optional, and defaults to "/".
@controller("/widgets")
class WidgetController {
  // _repo is an example repository that will be used in future examples.
  constructor(private _repo: WidgetRepo) {}
}
```

### Creating a route handler

Route handlers are created by decorating an async function on the controller with the appropriate decorator for the http method desired.

Supported decorators are

- `get(path?)` Creates a GET handler
- `head(path?)` Creates a HEAD handler
- `post(path?)` Creates a POST handler
- `put(path?)` Creates a PUT handler
- `del(path?)` Creates a DELETE handler
- `patch(path?)` Creates a PATCH handler
- `method(method, path?)` Creates a handler for the specified method

Warning: Only use one HTTP method decorator per method. The last decorator to be applied will override the others.

If no path is specified, the default "/" is used.

```js
import { controller, get } from "soapdish-controllers";

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  @get()
  async getWidgets() {
    return await this._repo.getWidgets();
  }
}
```

### Documenting the response

While not required, documenting responses provides two benefits:

- Your return value will be validated against the json-schema, and violations will result in a 500 error.
- The swagger documentation will include the documented data.

To document a response, use the `@response(statusCode, settings)` decorator on the method.
You can use multiple `@response` decorators to document multiple status codes.

Available settings are

- `description`
  A description for the response code. Displayed by swagger.
- `schema`
  JSON-Schema describing the response.
  If specified, responses with the specified status code will be validated against the schema. Non-matching responses
  will result in a `500 - Internal Server Error` being returned by the method.
  The schema is also used by the swagger documentation.

Note that in the example, we do not specify a status code when sending our result, so it will default to `200 - OK`.

```js
import { controller, get, response } from "soapdish-controllers";

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  @get()
  @response(200, {
    description: "Returns a list of all widgets",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          disposition: { enum: ["happy", "sad"] }
        },
        required: ["id"]
      }
    }
  })
  async getWidgets() {
    return await this._repo.getWidgets();
  }
}
```

### Adding a query parameter

Query parameters can be utilized by adding a `@queryParam(name, settings?)` decorator onto a method argument. The value of the query parameter will be supplied into the method argument when a request is made.

Available settings:

- `required`
  If true, the method will ensure the query parameter is provided before invoking the method. In the case that the query parameter is not provided, the request will return `400 - Bad Request` and the method will not be invoked.
- `schema`
  JSON-Schema to validate and coerce the value against.
  If this is provided, the query parameter will be validated against the schema. If the validation fails,
  the request will return `400 - Bad Request` and the method will not be invoked.
  Additionally, valid data will be coerced to javascript types depending on the requested json-schema type. For example, `{type: "number"}` will cast the string to a number before passing it to your method.

```js
import { controller, get, queryParam } from "soapdish-controllers";

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  @get()
  async getWidgets(
    @queryParam("limit", {required: false, schema: {type: "integer", minimum: 1}})
    limit: number
  ) {
    const widgets = await this._repo.getWidgets();
    return widgets.slice(0, limit);
  }
}
```

### Using path parameters

This library supports path parameters in the same style as express router path params.

Accessing path parameters is similar to accessing query params, and is done with the `@pathParam(name, settings?)` decorator. In this case, `name` must be the name of an express path parameter present in either the controller or method path. For example, `@get("/foo/:bar")` will create a path param called `bar`, and `@controller("/widgets/:style/list")` will create a path param called `style`.

Available settings:

- `schema`
  JSON-Schema to validate and coerce the value against.
  If this is provided, the path parameter will be validated against the schema. If the validation fails,
  the request will return `404 - Not Found` and the method will not be invoked.
  Additionally, valid data will be cocerced to javascript types depending on the requested json-schema type. For example, `{type: "number"}` will cast the string to a number before passing it to your method.

```js
import { controller, get, pathParam } from "soapdish-controllers";

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  // Create a handler for `/widgets/:widgetId`
  @get("/:widgetId")
  async getWidgetById(
    @path("widgetId", {schema: {type: "integer"}})
    widgetId: number
  ) {
    return await this._repo.getWidgetById(widgetId);
  }
}
```

### Returning status codes using errors

While not specifically a feature of this library, it is recommended that error cases be handled by making use of express' handling of properly formatted thrown errors. We strongly recommend the `http-errors` library for this case.

Remember to document your status codes using `@response`.

```js
import { controller, get, response, pathParam } from "soapdish-controllers";
import createError from "http-errors";

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  // Create a handler for `/widgets/:widgetId`
  @get("/:widgetId")
  @response(200, { description: "The widget was found."})
  @response(404, { description: "The widget was not found."})
  @response(500, { description: "The server encountered an error fetching the widget."})
  async getWidgetById(
    @path("widgetId", {type: "integer"})
    widgetId: number
  ) {
    try {
      return await this._repo.getWidgetById(widgetId);
    }
    catch (e) {
      if (e instanceof WidgetNotFoundError) {
        // Express will understand this error, and return `404 - Widget Not Found`.
        throw createError(404, "Widget Not Found");
      }

      // Express will capture the thrown error and return 500 - Internal Server Error.
      throw e;
    }
  }
}
```

### Retrieving the request body

A method parameter can receive the request body by decorating it with `@body(settings?)`.

By default, this library will set up a body parser for `application/json` content types. To support other formats, you must supply your own express middleware when setting up your express app.

Available settings:

- `required`
  If specified, the request will require a body to be passed. If no body is passed, the request will return `400 - Bad Request` and the method will not be invoked.
- `schema`
  JSON-Schema describing the request.
  If specified, the body will be validated against the json schema. If the validation fails, the request will return `400 - Bad Request`, the status message will indicate the failing validation rule, and the method will not be invoked.
  The schema will also be used in swagger documentation generation.

```js
import { controller, post, body } from "soapdish-controllers";

const widgetRequestSchema = {
  type: "object",
  properties: {
    disposition: {enum: ["happy", "sad"]}
  },
  required: ["disposition"]
};

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  @post()
  async createWidget(
    @body({required: true, schema: widgetRequestSchema})
    widget: Widget
  ) {
    return await this._repo.createWidget(widget);
  }
}
```

### Returning custom status codes and headers with the body

Custom status codes can be returned alongside a body by using the `result()` function. Wrapping your result with `result()` will return a chaining object that provides two functions:

- `return result(widget).status(statusCode)`
  Specifies a status code to send with the result
- `return result(widget).header(name, value)`
  Specifies a header to send with the result. Can be used multiple times.

The return value of `status` and `header` is chainable, allowing both a status and multiple headers to be sent.

```js
import { controller, post, body, result, response } from "soapdish-controllers";

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  @post()
  @response(201, "The widget has been created")
  async createWidget(
    @body({required: true})
    widget: Widget
  ) {
    const widget = await this._repo.createWidget(widget);

    return result(widget)
      .status(201)
      .header("Content-Location", `www.myserver.com/widgets/${widget.id}`);
  }
}
```

### Testing method results

In all cases, your controller methods should return the body to send as the response. This is still the case when the `result()` function is used to apply a status code and headers.

When `result()` is used, the resulting value still matches your result, but with the addition of symbol properties representing the status code and header collection. The functions it enables are provided through setting an object prototype and should not interfere with testing.

The status code and headers are attached using the `StatusCode` and `Headers` symbols, exported from the library. These can be used to test your results.

```js
import { StatusCode, Headers } from "soapdish-controllers";

const controller = new WidgetController(new MockRepo());

const result = await controller.createWidget({ disposition: "happy" });

expect(result.disposition).equals("happy");
expect(result[StatusCode]).equals(201);
expect(result[Headers]["Content-Location"]).equals(
  "www.myserver.com/widgets/1"
);
```

### Connecting your controller to express

The end result of soapdish-controllers is to create express Routers. This is done through the `createControllerRoute(...controllers)` function. This function will take any number of controller instances, and create a single express Router to handle all of them.

Note that the function expects instances of controllers, not the controller classes. You need to instantiate your class before passing it to the function.

```js
import express from "express";
import { createControllerRoute } from "soapdish-controllers";

import { WidgetController } from "./controllers/WidgetController";

const app = express();

const controllers = [new WidgetController(new WidgetRepository())];

const route = createControllerRoute(...controllers);

app.use(route);

app.listen(8080);
```

### Generating Swagger documentation for your controllers

To generate swagger path documentation for your controllers, use `createSwaggerPaths(...controllers)`. Like `createControllerRoute`, this function expects live instances of the controller classes.

Take note that this function does not return a fully formed swagger documentation object. Instead, it returns an object suitable for the `paths` key of swagger docs. You must specify the rest of the top level documentation keys.

```js
import express from "express";
import { createSwaggerPaths } from "soapdish-controllers";
import {
  serve as swaggerServe,
  setup as swaggerSetup
} from "swagger-ui-express";

import { WidgetController } from "./controllers/WidgetController";

const controllers = [new WidgetController(new WidgetRepository())];

const swaggerDocs = {
  openapi: "3.0.0",
  info: {
    title: "Soapdish Example",
    description: "Hello World",
    version: "1.0.0"
  },
  servers: [
    {
      url: "http://localhost:8080",
      description: "The Server"
    }
  ],
  paths: createSwaggerPaths(...controllers)
};

const app = express();

app.use("/api-docs", swaggerServe, swaggerSetup(swaggerDocs));
```
