[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / MatchPart

# Class: MatchPart

Defined in: [src/query/parts.ts:43](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L43)

MATCH query part

## Extends

- [`BaseQueryPart`](BaseQueryPart.md)

## Constructors

### Constructor

```ts
new MatchPart(patterns, optional): MatchPart;
```

Defined in: [src/query/parts.ts:65](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L65)

Create a new MATCH part

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `patterns` | [`MatchPattern`](../interfaces/MatchPattern.md)[] | `[]` | Match patterns |
| `optional` | `boolean` | `false` | Whether this is an OPTIONAL MATCH |

#### Returns

`MatchPart`

#### Overrides

[`BaseQueryPart`](BaseQueryPart.md).[`constructor`](BaseQueryPart.md#constructor)

## Properties

| Property | Type | Default value | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`QueryPartType`](../enumerations/QueryPartType.md) | `QueryPartType.MATCH` | Query part type | [`BaseQueryPart`](BaseQueryPart.md).[`type`](BaseQueryPart.md#type) | [src/query/parts.ts:47](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L47) |

## Methods

### addPattern()

```ts
addPattern(pattern): void;
```

Defined in: [src/query/parts.ts:76](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L76)

Add a pattern

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pattern` | [`MatchPattern`](../interfaces/MatchPattern.md) | Match pattern |

#### Returns

`void`

***

### setOptional()

```ts
setOptional(optional): void;
```

Defined in: [src/query/parts.ts:85](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L85)

Set optional flag

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `optional` | `boolean` | Whether this is an OPTIONAL MATCH |

#### Returns

`void`

***

### getPatterns()

```ts
getPatterns(): MatchPattern[];
```

Defined in: [src/query/parts.ts:94](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L94)

Get patterns

#### Returns

[`MatchPattern`](../interfaces/MatchPattern.md)[]

Patterns

***

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/parts.ts:101](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L101)

Convert to Cypher string

#### Returns

`string`

#### Overrides

[`BaseQueryPart`](BaseQueryPart.md).[`toCypher`](BaseQueryPart.md#tocypher)

***

### getParameters()

```ts
getParameters(): Record<string, any>;
```

Defined in: [src/query/parts.ts:115](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L115)

Get parameters used in this query part

#### Returns

`Record`\<`string`, `any`\>

#### Overrides

[`BaseQueryPart`](BaseQueryPart.md).[`getParameters`](BaseQueryPart.md#getparameters)
