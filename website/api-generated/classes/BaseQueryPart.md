[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / BaseQueryPart

# Class: `abstract` BaseQueryPart

Defined in: [src/query/parts.ts:21](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L21)

Base class for query parts

## Extended by

- [`MatchPart`](MatchPart.md)
- [`WherePart`](WherePart.md)
- [`ReturnPart`](ReturnPart.md)
- [`OrderByPart`](OrderByPart.md)
- [`LimitPart`](LimitPart.md)
- [`SkipPart`](SkipPart.md)
- [`WithPart`](WithPart.md)
- [`UnwindPart`](UnwindPart.md)

## Implements

- [`QueryPart`](../interfaces/QueryPart.md)

## Constructors

### Constructor

```ts
new BaseQueryPart(): BaseQueryPart;
```

#### Returns

`BaseQueryPart`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | `abstract` | [`QueryPartType`](../enumerations/QueryPartType.md) | Query part type | [src/query/parts.ts:25](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L25) |

## Methods

### toCypher()

```ts
abstract toCypher(): string;
```

Defined in: [src/query/parts.ts:30](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L30)

Convert to Cypher string

#### Returns

`string`

#### Implementation of

[`QueryPart`](../interfaces/QueryPart.md).[`toCypher`](../interfaces/QueryPart.md#tocypher)

***

### getParameters()

```ts
getParameters(): Record<string, any>;
```

Defined in: [src/query/parts.ts:35](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L35)

Get parameters used in this query part

#### Returns

`Record`\<`string`, `any`\>

#### Implementation of

[`QueryPart`](../interfaces/QueryPart.md).[`getParameters`](../interfaces/QueryPart.md#getparameters)
