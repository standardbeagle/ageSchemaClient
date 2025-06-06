[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / MissingRequiredPropertyError

# Class: MissingRequiredPropertyError

Defined in: [src/schema/errors.ts:68](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/errors.ts#L68)

Error thrown when a required property is missing

## Extends

- [`SchemaValidationError`](SchemaValidationError.md)

## Constructors

### Constructor

```ts
new MissingRequiredPropertyError(property, path?): MissingRequiredPropertyError;
```

Defined in: [src/schema/errors.ts:75](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/errors.ts#L75)

Create a new MissingRequiredPropertyError

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `property` | `string` | Missing property name |
| `path?` | `string` | Path to the element with the missing property |

#### Returns

`MissingRequiredPropertyError`

#### Overrides

[`SchemaValidationError`](SchemaValidationError.md).[`constructor`](SchemaValidationError.md#constructor)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="stacktracelimit"></a> `stackTraceLimit` | `static` | `number` | The `Error.stackTraceLimit` property specifies the number of stack frames collected by a stack trace (whether generated by `new Error().stack` or `Error.captureStackTrace(obj)`). The default value is `10` but may be set to any valid JavaScript number. Changes will affect any stack trace captured _after_ the value has been changed. If set to a non-number value, or set to a negative number, stack traces will not capture any frames. | [`SchemaValidationError`](SchemaValidationError.md).[`stackTraceLimit`](SchemaValidationError.md#stacktracelimit) | node\_modules/.pnpm/@types+node@22.15.17/node\_modules/@types/node/globals.d.ts:161 |
| <a id="cause"></a> `cause?` | `readonly` | `unknown` | Error cause | [`SchemaValidationError`](SchemaValidationError.md).[`cause`](SchemaValidationError.md#cause) | [src/schema/errors.ts:17](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/errors.ts#L17) |
| <a id="path"></a> `path?` | `readonly` | `string` | Path to the invalid element | [`SchemaValidationError`](SchemaValidationError.md).[`path`](SchemaValidationError.md#path) | [src/schema/errors.ts:57](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/errors.ts#L57) |
| <a id="property"></a> `property` | `readonly` | `string` | Missing property name | - | [src/schema/errors.ts:75](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/errors.ts#L75) |
| <a id="name"></a> `name` | `public` | `string` | - | [`SchemaValidationError`](SchemaValidationError.md).[`name`](SchemaValidationError.md#name) | website/node\_modules/.pnpm/typescript@5.6.3/node\_modules/typescript/lib/lib.es5.d.ts:1076 |
| <a id="message"></a> `message` | `public` | `string` | - | [`SchemaValidationError`](SchemaValidationError.md).[`message`](SchemaValidationError.md#message) | website/node\_modules/.pnpm/typescript@5.6.3/node\_modules/typescript/lib/lib.es5.d.ts:1077 |
| <a id="stack"></a> `stack?` | `public` | `string` | - | [`SchemaValidationError`](SchemaValidationError.md).[`stack`](SchemaValidationError.md#stack) | website/node\_modules/.pnpm/typescript@5.6.3/node\_modules/typescript/lib/lib.es5.d.ts:1078 |

## Methods

### captureStackTrace()

```ts
static captureStackTrace(targetObject, constructorOpt?): void;
```

Defined in: node\_modules/.pnpm/@types+node@22.15.17/node\_modules/@types/node/globals.d.ts:145

Creates a `.stack` property on `targetObject`, which when accessed returns
a string representing the location in the code at which
`Error.captureStackTrace()` was called.

```js
const myObject = {};
Error.captureStackTrace(myObject);
myObject.stack;  // Similar to `new Error().stack`
```

The first line of the trace will be prefixed with
`${myObject.name}: ${myObject.message}`.

The optional `constructorOpt` argument accepts a function. If given, all frames
above `constructorOpt`, including `constructorOpt`, will be omitted from the
generated stack trace.

The `constructorOpt` argument is useful for hiding implementation
details of error generation from the user. For instance:

```js
function a() {
  b();
}

function b() {
  c();
}

function c() {
  // Create an error without stack trace to avoid calculating the stack trace twice.
  const { stackTraceLimit } = Error;
  Error.stackTraceLimit = 0;
  const error = new Error();
  Error.stackTraceLimit = stackTraceLimit;

  // Capture the stack trace above function b
  Error.captureStackTrace(error, b); // Neither function c, nor b is included in the stack trace
  throw error;
}

a();
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

[`SchemaValidationError`](SchemaValidationError.md).[`captureStackTrace`](SchemaValidationError.md#capturestacktrace)

***

### prepareStackTrace()

```ts
static prepareStackTrace(err, stackTraces): any;
```

Defined in: node\_modules/.pnpm/@types+node@22.15.17/node\_modules/@types/node/globals.d.ts:149

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

#### Returns

`any`

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

[`SchemaValidationError`](SchemaValidationError.md).[`prepareStackTrace`](SchemaValidationError.md#preparestacktrace)
