[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / WithPart

# Class: WithPart

Defined in: [src/query/parts.ts:355](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L355)

WITH query part

## Extends

- [`BaseQueryPart`](BaseQueryPart.md)

## Constructors

### Constructor

```ts
new WithPart(expressions, distinct): WithPart;
```

Defined in: [src/query/parts.ts:377](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L377)

Create a new WITH part

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `expressions` | `string`[] | `undefined` | With expressions |
| `distinct` | `boolean` | `false` | Whether to use distinct |

#### Returns

`WithPart`

#### Overrides

[`BaseQueryPart`](BaseQueryPart.md).[`constructor`](BaseQueryPart.md#constructor)

## Properties

| Property | Type | Default value | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`QueryPartType`](../enumerations/QueryPartType.md) | `QueryPartType.WITH` | Query part type | [`BaseQueryPart`](BaseQueryPart.md).[`type`](BaseQueryPart.md#type) | [src/query/parts.ts:359](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L359) |

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

[`BaseQueryPart`](BaseQueryPart.md).[`getParameters`](BaseQueryPart.md#getparameters)

***

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/parts.ts:386](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L386)

Convert to Cypher string

#### Returns

`string`

#### Overrides

[`BaseQueryPart`](BaseQueryPart.md).[`toCypher`](BaseQueryPart.md#tocypher)
