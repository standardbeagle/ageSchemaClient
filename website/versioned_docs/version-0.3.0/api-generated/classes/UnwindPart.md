[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / UnwindPart

# Class: UnwindPart

Defined in: [src/query/parts.ts:397](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L397)

UNWIND query part

## Extends

- [`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md)

## Constructors

### Constructor

```ts
new UnwindPart(expression, alias): UnwindPart;
```

Defined in: [src/query/parts.ts:419](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L419)

Create a new UNWIND part

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `expression` | `string` | Expression to unwind |
| `alias` | `string` | Alias for unwound items |

#### Returns

`UnwindPart`

#### Overrides

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`constructor`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#constructor)

## Properties

| Property | Type | Default value | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`QueryPartType`](/ageSchemaClient/api-generated/enumerations/QueryPartType.md) | `QueryPartType.UNWIND` | Query part type | [`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`type`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#type) | [src/query/parts.ts:401](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L401) |

## Methods

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/parts.ts:428](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L428)

Convert to Cypher string

#### Returns

`string`

#### Overrides

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`toCypher`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#tocypher)

***

### getParameters()

```ts
getParameters(): Record<string, any>;
```

Defined in: [src/query/parts.ts:435](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L435)

Get parameters used in this query part

#### Returns

`Record`\<`string`, `any`\>

#### Overrides

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`getParameters`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#getparameters)
