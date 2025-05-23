[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / ReturnPart

# Class: ReturnPart

Defined in: [src/query/parts.ts:174](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L174)

RETURN query part

## Extends

- [`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md)

## Constructors

### Constructor

```ts
new ReturnPart(expressions, distinct): ReturnPart;
```

Defined in: [src/query/parts.ts:201](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L201)

Create a new RETURN part

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `expressions` | `string`[] | `undefined` | Return expressions |
| `distinct` | `boolean` | `false` | Whether to return distinct results |

#### Returns

`ReturnPart`

#### Overrides

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`constructor`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#constructor)

## Properties

| Property | Type | Default value | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`QueryPartType`](/ageSchemaClient/api-generated/enumerations/QueryPartType.md) | `QueryPartType.RETURN` | Query part type | [`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`type`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#type) | [src/query/parts.ts:178](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L178) |

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

### addGroupBy()

```ts
addGroupBy(expressions): void;
```

Defined in: [src/query/parts.ts:212](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L212)

Add group by expressions

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `expressions` | `string`[] | Group by expressions |

#### Returns

`void`

***

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/parts.ts:219](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L219)

Convert to Cypher string

#### Returns

`string`

#### Overrides

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`toCypher`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#tocypher)
