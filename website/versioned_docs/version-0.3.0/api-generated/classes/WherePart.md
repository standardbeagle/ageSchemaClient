[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / WherePart

# Class: WherePart

Defined in: [src/query/parts.ts:128](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L128)

WHERE query part

## Extends

- [`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md)

## Constructors

### Constructor

```ts
new WherePart(condition, parameters): WherePart;
```

Defined in: [src/query/parts.ts:150](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L150)

Create a new WHERE part

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | `string` | Condition expression |
| `parameters` | `Record`\<`string`, `any`\> | Parameters |

#### Returns

`WherePart`

#### Overrides

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`constructor`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#constructor)

## Properties

| Property | Type | Default value | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`QueryPartType`](/ageSchemaClient/api-generated/enumerations/QueryPartType.md) | `QueryPartType.WHERE` | Query part type | [`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`type`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#type) | [src/query/parts.ts:132](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L132) |

## Methods

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/parts.ts:159](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L159)

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

Defined in: [src/query/parts.ts:166](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L166)

Get parameters used in this query part

#### Returns

`Record`\<`string`, `any`\>

#### Overrides

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`getParameters`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#getparameters)
