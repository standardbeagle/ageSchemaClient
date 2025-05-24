[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / SchemaParser

# Class: SchemaParser

Defined in: [src/schema/parser.ts:80](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/parser.ts#L80)

Schema parser for parsing and validating schema definitions

## Constructors

### Constructor

```ts
new SchemaParser(config): SchemaParser;
```

Defined in: [src/schema/parser.ts:88](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/parser.ts#L88)

Create a new SchemaParser

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`SchemaParserConfig`](/ageSchemaClient/api-generated/interfaces/SchemaParserConfig.md) | Parser configuration |

#### Returns

`SchemaParser`

## Methods

### parse()

```ts
parse(schemaJson): SchemaDefinition;
```

Defined in: [src/schema/parser.ts:100](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/parser.ts#L100)

Parse a JSON schema string

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schemaJson` | `string` | JSON schema string |

#### Returns

[`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md)

Parsed schema definition

#### Throws

SchemaParseError if parsing fails

#### Throws

SchemaValidationError if validation fails

***

### parseObject()

```ts
parseObject(schema): SchemaDefinition;
```

Defined in: [src/schema/parser.ts:150](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/parser.ts#L150)

Parse a schema object

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | `unknown` | Schema object |

#### Returns

[`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md)

Validated schema definition

#### Throws

SchemaValidationError if validation fails

***

### validate()

```ts
validate(schema): void;
```

Defined in: [src/schema/parser.ts:189](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/parser.ts#L189)

Validate a schema object

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | `unknown` | Schema object to validate |

#### Returns

`void`

#### Throws

SchemaValidationError if validation fails
