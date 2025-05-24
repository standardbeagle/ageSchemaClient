[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / ErrorCollector

# Class: ErrorCollector

Defined in: [src/schema/error-collector.ts:19](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L19)

Collects validation errors during schema validation

## Constructors

### Constructor

```ts
new ErrorCollector(): ErrorCollector;
```

#### Returns

`ErrorCollector`

## Methods

### addError()

```ts
addError(error): void;
```

Defined in: [src/schema/error-collector.ts:28](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L28)

Add a validation error

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `error` | [`SchemaValidationError`](/ageSchemaClient/api-generated/classes/SchemaValidationError.md) | Validation error |

#### Returns

`void`

***

### addMissingRequiredProperty()

```ts
addMissingRequiredProperty(property): void;
```

Defined in: [src/schema/error-collector.ts:37](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L37)

Add a missing required property error

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `property` | `string` | Missing property name |

#### Returns

`void`

***

### addInvalidPropertyType()

```ts
addInvalidPropertyType(
   property, 
   expectedType, 
   actualType): void;
```

Defined in: [src/schema/error-collector.ts:48](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L48)

Add an invalid property type error

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `property` | `string` | Property name |
| `expectedType` | `string` | Expected property type |
| `actualType` | `string` | Actual property type |

#### Returns

`void`

***

### addInvalidRelationship()

```ts
addInvalidRelationship(edge, message): void;
```

Defined in: [src/schema/error-collector.ts:69](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L69)

Add an invalid relationship error

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `edge` | `string` | Edge label |
| `message` | `string` | Error message |

#### Returns

`void`

***

### addCircularDependency()

```ts
addCircularDependency(cycle): void;
```

Defined in: [src/schema/error-collector.ts:84](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L84)

Add a circular dependency error

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cycle` | `string`[] | Array of elements in the cycle |

#### Returns

`void`

***

### addValidationError()

```ts
addValidationError(message): void;
```

Defined in: [src/schema/error-collector.ts:98](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L98)

Add a generic validation error

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Error message |

#### Returns

`void`

***

### hasErrors()

```ts
hasErrors(): boolean;
```

Defined in: [src/schema/error-collector.ts:112](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L112)

Check if there are any errors

#### Returns

`boolean`

Whether there are any errors

***

### getErrors()

```ts
getErrors(): SchemaValidationError[];
```

Defined in: [src/schema/error-collector.ts:121](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L121)

Get all errors

#### Returns

[`SchemaValidationError`](/ageSchemaClient/api-generated/classes/SchemaValidationError.md)[]

Array of validation errors

***

### getCurrentPath()

```ts
getCurrentPath(): string;
```

Defined in: [src/schema/error-collector.ts:130](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L130)

Get the current path as a string

#### Returns

`string`

Current path

***

### pushPath()

```ts
pushPath(segment): void;
```

Defined in: [src/schema/error-collector.ts:139](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L139)

Push a path segment onto the current path

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `segment` | `string` | Path segment |

#### Returns

`void`

***

### popPath()

```ts
popPath(): string;
```

Defined in: [src/schema/error-collector.ts:148](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L148)

Pop a path segment from the current path

#### Returns

`string`

Popped path segment

***

### withPath()

```ts
withPath<T>(segment, fn): T;
```

Defined in: [src/schema/error-collector.ts:158](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L158)

Execute a function with a path segment added to the current path

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `segment` | `string` | Path segment |
| `fn` | () => `T` | Function to execute |

#### Returns

`T`

***

### throwIfErrors()

```ts
throwIfErrors(): void;
```

Defined in: [src/schema/error-collector.ts:172](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/error-collector.ts#L172)

Throw a ValidationErrorCollection if there are any errors

#### Returns

`void`

#### Throws

ValidationErrorCollection if there are any errors
