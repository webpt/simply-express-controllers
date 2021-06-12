# simply-express-controllers

No heavy frameworks, no IOC, just a simple robust express controller library using modern ES6 decorators.

Create synchronous and asynchronous express route controllers free of boilerplate with full json schema validation. Outputs clean express routers and integrates well into whatever software architecture you choose. Also supports the automatic generation of swagger 3.0 documentation.

## Why we built this

Express route controllers should be simple and declarative. However, all of the available solutions we trialed came up short. Some provided too little; acting as little more than aliases around the express router functions. Others tried to take complete control of the application, mandating the use of home-grown IOC containers, forcing the application into a pre-chosen program architecture, and hiding the express app behind walls of abstraction.

This library seeks to find the perfect middle ground. It solves the issue of boilerplate code and provides a robust system of validation and documentation, while still producing simple express routers and leaving the user in control of their own express configuration.

## Design Philosophy

This library is designed to be narrowly focused on solving the creation of express controllers. As such, it does not do anything other than create routes, validate input and output, and generate swagger documentation. The creation and configuration of the express app, and the chosen program architecture, is entirely up to you.

## Usage

### Creating the controller

To create an express route, create a class that will represent a controller for the route. Decorate this class with `@controller`

```js
import { controller } from "simply-express-controllers";

// Path is optional, and defaults to "/".
@controller("/widgets")
class WidgetController {
  // _repo is an example repository that will be used in future examples.
  constructor(private _repo: WidgetRepo) {}
}
```

### Adding middleware

Middleware can be added on a per-controller basis by using the `@use` decorator.

```js
import { controller } from "simply-express-controllers";
import cors from "cors";

// Path is optional, and defaults to "/".
@controller("/widgets")
@use(cors())
class WidgetController {
  // _repo is an example repository that will be used in future examples.
  constructor(private _repo: WidgetRepo) {}
}
```

### Creating a route handler

Route handlers are created by decorating an async function on the controller with the appropriate decorator for the http method desired.

Supported decorators are

- `@get(path?, settings?)` Creates a GET handler
- `@head(path?, settings?)` Creates a HEAD handler
- `@post(path?, settings?)` Creates a POST handler
- `@put(path?, settings?)` Creates a PUT handler
- `@del(path?, settings?)` Creates a DELETE handler
- `@patch(path?, settings?)` Creates a PATCH handler

There is also a fallback decorator `@method(method, path?, settings?)` to handle arbitrary methods.

Supported arguments:

- `path`
  Optional.
  Defaults to "/".
  The path relative to the controller path for this method.
- `settings`
  Optional.
  Various settings for this path.

Supported decorator settings:

- `summary`
  A summary of the method. Used for swagger documentation.
- `description`
  A description of the method. Used for swagger documentation.
- `tags`
  An array of tags for this method. Used for swagger documentation.

Warning: Only use one HTTP method decorator per method. The last decorator to be applied will override the others.

```js
import { controller, get } from "simply-express-controllers";

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  @get()
  async getWidgets() {
    return await this._repo.getWidgets();
  }

  @get("/newest")
  async getNewestWidget() {
    return await this._repo.getNewestWidget();
  }
}
```

### Providing swagger documentation on the method

When defining a method, additional documentation can be provided for use by swagger. The following properties are supported by the method decorators:

- `summary`
  Provides a summary of the method to swagger
- `description`
  Provides a description of the method to swagger
- `tags`
  Provides method tags to swagger

```js
import { controller, get } from "simply-express-controllers";

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  @get({
    summary: "Gets an array of all widgets",
    tags: ["widget"]
  })
  async getWidgets() {
    return await this._repo.getWidgets();
  }

  @get("/newest", {
    summary: "Gets the newest widget",
    description: "The most recent widget to be created will be returned.",
    tags: ["widget"]
  })
  async getNewestWidget() {
    return await this._repo.getNewestWidget();
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
The presense of the `@response` decorator does not affect the status code we use with our result, but instead documents
and validates the response when the status code is used.

```js
import { controller, get, response } from "simply-express-controllers";

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

When decorating a method argument, the argument name does not need to match the query parameter name.

Available settings:

- `required`
  If true, the method will ensure the query parameter is provided before invoking the method. In the case that the query parameter is not provided, the request will return `400 - Bad Request` and the method will not be invoked.
- `schema`
  JSON-Schema to validate and coerce the value against.
  If this is provided, the query parameter will be validated against the schema. If the validation fails,
  the request will return `422 - Unprocessable Entity` and the method will not be invoked.
  Additionally, valid data will be coerced to javascript types depending on the requested json-schema type. For example, `{type: "number"}` will cast the string to a number before passing it to your method.

```js
import { controller, get, queryParam } from "simply-express-controllers";

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  @get()
  async getWidgets(
    @queryParam("limit", {required: false, schema: {type: "integer", minimum: 1}})
    widgetLimit: number
  ) {
    const widgets = await this._repo.getWidgets();
    return widgets.slice(0, widgetLimit);
  }
}
```

### Using path parameters

This library supports path parameters in the same style as express router path params.

Accessing path parameters is similar to accessing query params, and is done with the `@pathParam(name, settings?)` decorator. In this case, `name` must be the name of an express path parameter present in either the controller or method path. For example, `@get("/foo/:bar")` will create a path param called `bar`, and `@controller("/widgets/:style/list")` will create a path param called `style`.

When decorating a method argument, the argument name does not need to match the path parameter name.

Available settings:

- `schema`
  JSON-Schema to validate and coerce the value against.
  If this is provided, the path parameter will be validated against the schema. If the validation fails,
  the request will return `404 - Not Found` and the method will not be invoked.
  Additionally, valid data will be cocerced to javascript types depending on the requested json-schema type. For example, `{type: "number"}` and `{type: "integer"}` will cast the string to a number.

```js
import { controller, get, pathParam } from "simply-express-controllers";

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  // Create a handler for `/widgets/:widgetId`
  @get("/:widget_id")
  async getWidgetById(
    @path("widget_id", {schema: {type: "integer"}})
    widgetId: number
  ) {
    return await this._repo.getWidgetById(widgetId);
  }
}
```

### Returning status codes using errors

While not specifically a feature of this library, it is recommended that error cases be handled by making use of express' handling of properly formatted thrown errors. We strongly recommend the `http-errors` library for this case.

Remember to document your status codes using `@response` for the benefit of swagger.

```js
import { controller, get, response, pathParam } from "simply-express-controllers";
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
import { controller, post, body } from "simply-express-controllers";

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

### Returning custom status codes and headers with the result

Custom status codes can be returned alongside a body by using the `result()` function. Wrapping your result with `result()` will return a chaining object that provides two functions:

- `return result(widget).status(statusCode)`
  Specifies a status code to send with the result
- `return result(widget).header(name, value)`
  Specifies a header to send with the result. Can be used multiple times.

The return value of `status` and `header` is chainable, allowing both a status and multiple headers to be sent.

```js
import { controller, post, body, result, response } from "simply-express-controllers";

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

### Returning cookies

Cookies can also be sent with the help of `result().cookie(name, value, settings?)`.

The settings parameter is passed directly to express, and supports all the same values as the options object of `Response.cookie()`.
For possible values, see the [express documentation](https://expressjs.com/en/api.html#res.cookie).

```js
import { controller, post, body, result } from "simply-express-controllers";

@controller("/user")
class UserController {
  constructor(private _auth: UserAuthenticator) {}

  @post("/login")
  async authenticate(
    @body()
    payload: LoginPayload
  ) {
    const token = this._auth.loginUser(payload);

    return result({})
      .status(200)
      .cookie("local_access_token", token, {
        maxAge: 60 * 60 * 1000
      });
  }
}
```

### Testing methods with `result()`

In order to attach properties to your response body, `result()` wraps the result in a class instance. To test the result, you must access the properties of this class:

- `body`
  The body passed to `result()`.
- `statusCode`
  The status code specified by `.status()`.
- `headers`
  An object mapping header names to header values, specified by `.header()`.
- `cookies`
  An object mapping cookie names to cookie data, specified by `.cookie()`.

```js
const controller = new WidgetController(new MockRepo());

const result = await controller.createWidget({ disposition: "happy" });

expect(result.body.disposition).toEqual("happy");
expect(result.statusCode).toEqual(201);
expect(result.headers["Content-Location"]).toEqual(
  "www.myserver.com/widgets/1"
);
expect(result.cookies["my-cookie"].value).toBeDefined();
```

### Retrieving the express Request and Response

Although this library attempts to provide decorators for retrieving information from the request and response, no library can cover all use cases and sometimes direct access to the request and response objects are needed.

To get direct access to the request and response objects, use the `@expressRequest()` and `@expressResponse()` method argument decorators.

Note that there is no way to suppress the sending of the response on method completion, so attempting to use Response.send() may result in an error.

```js
import { controller, get, expressRequest, expressResponse } from "simply-express-controllers";
import { Request, Response } from "express";
import createError from "http-errors";

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  @get()
  async getWidget(
    @expressRequest()
    req: Request,
    @expressResponse()
    res: Response
  ) {
    const user = req.user;
    if (!userCanAccessWidgets(user)) {
      throw createError(403, "Access Denied");
    }

    const widget = await this._repo.createWidget(widget);

    res.locals.widgetsFetched = true;

    return result(widget)
      .status(201)
      .header("Content-Location", `www.myserver.com/widgets/${widget.id}`);
  }
}
```

### Overriding the swagger documentation

Under most cases, the auto-generated swagger documentation should be sufficient. However, it is possible to suppress
the auto-generated documentation and supply your own swagger docs by the use of the `@swaggerMethod` decorator.

```js
import { controller, get, swaggerMethod } from "simply-express-controllers";

@controller("/widgets")
class WidgetController {
  constructor(private _repo: WidgetRepo) {}

  @get()
  @swaggerMethod({
    summary: "Gets the widgets",
    responses: {
      "200": {
        description: "An array of widgets",
        content: {
          "application/json": {
            schema: widgetSchema
          }
        }
      }
    }
  })
  async getWidgets() {
    return await this._repo.getWidgets();
  }
}
```

### Connecting your controller to express

The end result of simply-express-controllers is to create express Routers. This is done through the `createControllerRoute(...controllers)` function. This function will take any number of controller instances, and create a single express Router to handle all of them.

Note that the function expects instances of controllers, not the controller classes. You need to instantiate your class before passing it to the function.

```js
import express from "express";
import { createControllerRoute } from "simply-express-controllers";

import { WidgetController } from "./controllers/WidgetController";

const app = express();

const controllers = [new WidgetController(new WidgetRepository())];

const route = createControllerRoute(...controllers);

app.use(route);

app.listen(8080);
```

There are many ways of automating the collection of controllers, and the choice is left up to you.

Some possible solutions:

- Collect all controllers in an index file, and export as an array.
- Automatically collect controllers from a known folder using [require-dir](https://www.npmjs.com/package/require-dir).
- Use an IOC container and bind all controllers under a common identifier.

### Generating Swagger documentation for your controllers

To generate swagger path documentation for your controllers, use `createSwaggerPaths(...controllers)`. Like `createControllerRoute`, this function expects live instances of the controller classes.

Take note that this function does not return a fully formed swagger documentation object. Instead, it returns an object suitable for the `paths` key of swagger docs. You must specify the rest of the top level documentation keys.

```js
import express from "express";
import { createSwaggerPaths } from "simply-express-controllers";
import {
  serve as swaggerServe,
  setup as swaggerSetup,
} from "swagger-ui-express";

import { WidgetController } from "./controllers/WidgetController";

const controllers = [new WidgetController(new WidgetRepository())];

const swaggerDocs = {
  openapi: "3.0.0",
  info: {
    title: "Soapdish Example",
    description: "Hello World",
    version: "1.0.0",
  },
  servers: [
    {
      url: "http://localhost:8080",
      description: "The Server",
    },
  ],
  paths: createSwaggerPaths(...controllers),
};

const app = express();

app.use("/api-docs", swaggerServe, swaggerSetup(swaggerDocs));
```
