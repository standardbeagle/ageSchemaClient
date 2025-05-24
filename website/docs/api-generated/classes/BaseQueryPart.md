[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / BaseQueryPart

# Class: `abstract` BaseQueryPart

Defined in: [src/query/parts.ts:21](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L21)

Base class for query parts

## Extended by

- [`MatchPart`](/ageSchemaClient/api-generated/classes/MatchPart.md)
- [`WherePart`](/ageSchemaClient/api-generated/classes/WherePart.md)
- [`ReturnPart`](/ageSchemaClient/api-generated/classes/ReturnPart.md)
- [`OrderByPart`](/ageSchemaClient/api-generated/classes/OrderByPart.md)
- [`LimitPart`](/ageSchemaClient/api-generated/classes/LimitPart.md)
- [`SkipPart`](/ageSchemaClient/api-generated/classes/SkipPart.md)
- [`WithPart`](/ageSchemaClient/api-generated/classes/WithPart.md)
- [`UnwindPart`](/ageSchemaClient/api-generated/classes/UnwindPart.md)

## Implements

- [`QueryPart`](/ageSchemaClient/api-generated/interfaces/QueryPart.md)

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
| <a id="type"></a> `type` | `abstract` | [`QueryPartType`](/ageSchemaClient/api-generated/enumerations/QueryPartType.md) | Query part type | [src/query/parts.ts:25](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L25) |

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

[`QueryPart`](/ageSchemaClient/api-generated/interfaces/QueryPart.md).[`toCypher`](/ageSchemaClient/api-generated/interfaces/QueryPart.md#tocypher)

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

[`QueryPart`](/ageSchemaClient/api-generated/interfaces/QueryPart.md).[`getParameters`](/ageSchemaClient/api-generated/interfaces/QueryPart.md#getparameters)
