[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / SchemaValidator

# Class: SchemaValidator

Defined in: [src/schema/validator.ts:62](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/validator.ts#L62)

Schema validator for validating data against schema definitions

## Constructors

### Constructor

```ts
new SchemaValidator(schema, config): SchemaValidator;
```

Defined in: [src/schema/validator.ts:72](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/validator.ts#L72)

Create a new SchemaValidator

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) | Schema definition |
| `config` | [`SchemaValidatorConfig`](/ageSchemaClient/api-generated/interfaces/SchemaValidatorConfig.md) | Validator configuration |

#### Returns

`SchemaValidator`

## Methods

### validateVertex()

```ts
validateVertex(
   label, 
   data, 
   throwOnError): ValidationResult;
```

Defined in: [src/schema/validator.ts:85](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/validator.ts#L85)

Validate a vertex against the schema

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Vertex label |
| `data` | `unknown` | `undefined` | Vertex data |
| `throwOnError` | `boolean` | `true` | - |

#### Returns

`ValidationResult`

Validation result

#### Throws

SchemaValidationError if validation fails and throwOnError is true

***

### validateEdge()

```ts
validateEdge(
   label, 
   data, 
   throwOnError): ValidationResult;
```

Defined in: [src/schema/validator.ts:114](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/validator.ts#L114)

Validate an edge against the schema

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Edge label |
| `data` | `unknown` | `undefined` | Edge data |
| `throwOnError` | `boolean` | `true` | Whether to throw an error if validation fails |

#### Returns

`ValidationResult`

Validation result

#### Throws

SchemaValidationError if validation fails and throwOnError is true

***

### validateVertexAndThrow()

```ts
validateVertexAndThrow(label, data): void;
```

Defined in: [src/schema/validator.ts:141](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/validator.ts#L141)

Validate a vertex against the schema and throw an error if validation fails

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `string` | Vertex label |
| `data` | `unknown` | Vertex data |

#### Returns

`void`

#### Throws

SchemaValidationError if validation fails

***

### validateEdgeAndThrow()

```ts
validateEdgeAndThrow(label, data): void;
```

Defined in: [src/schema/validator.ts:156](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/validator.ts#L156)

Validate an edge against the schema and throw an error if validation fails

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `string` | Edge label |
| `data` | `unknown` | Edge data |

#### Returns

`void`

#### Throws

SchemaValidationError if validation fails

***

### validateProperty()

```ts
validateProperty(
   property, 
   definition, 
   value, 
   throwOnError): ValidationResult;
```

Defined in: [src/schema/validator.ts:174](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/validator.ts#L174)

Validate a property value against a property definition

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `property` | `string` | `undefined` | Property name |
| `definition` | [`PropertyDefinition`](/ageSchemaClient/api-generated/interfaces/PropertyDefinition.md) | `undefined` | Property definition |
| `value` | `unknown` | `undefined` | Property value |
| `throwOnError` | `boolean` | `true` | Whether to throw an error if validation fails |

#### Returns

`ValidationResult`

Validation result

#### Throws

SchemaValidationError if validation fails and throwOnError is true

***

### validatePropertyAndThrow()

```ts
validatePropertyAndThrow(
   property, 
   definition, 
   value): void;
```

Defined in: [src/schema/validator.ts:207](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/validator.ts#L207)

Validate a property value against a property definition and throw an error if validation fails

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `property` | `string` | Property name |
| `definition` | [`PropertyDefinition`](/ageSchemaClient/api-generated/interfaces/PropertyDefinition.md) | Property definition |
| `value` | `unknown` | Property value |

#### Returns

`void`

#### Throws

SchemaValidationError if validation fails
