[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / LimitPart

# Class: LimitPart

Defined in: [src/query/parts.ts:291](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L291)

LIMIT query part

## Extends

- [`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md)

## Constructors

### Constructor

```ts
new LimitPart(count): LimitPart;
```

Defined in: [src/query/parts.ts:307](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L307)

Create a new LIMIT part

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `count` | `number` | Limit count |

#### Returns

`LimitPart`

#### Overrides

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`constructor`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#constructor)

## Properties

| Property | Type | Default value | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`QueryPartType`](/ageSchemaClient/api-generated/enumerations/QueryPartType.md) | `QueryPartType.LIMIT` | Query part type | [`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`type`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#type) | [src/query/parts.ts:295](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L295) |

## Methods

### getParameters()

```ts
getParameters(): Record<string, any>;
```

Defined in: [src/query/parts.ts:35](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L35)

Get parameters used in this query part

#### Returns

`Record`\<`string`, `any`\>

#### Inherited from

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`getParameters`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#getparameters)

***

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/parts.ts:315](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L315)

Convert to Cypher string

#### Returns

`string`

#### Overrides

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`toCypher`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#tocypher)
