[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / PathPart

# Class: PathPart

Defined in: [src/query/path.ts:25](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L25)

Path part class

## Implements

- [`QueryPart`](../interfaces/QueryPart.md)

## Constructors

### Constructor

```ts
new PathPart(pattern, alias): PathPart;
```

Defined in: [src/query/path.ts:47](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L47)

Create a new path part

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pattern` | `string` | Path pattern |
| `alias` | `string` | Path alias |

#### Returns

`PathPart`

## Properties

| Property | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`QueryPartType`](../enumerations/QueryPartType.md) | `QueryPartType.MATCH` | Query part type | [src/query/path.ts:29](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L29) |

## Methods

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/path.ts:55](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L55)

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

Defined in: [src/query/path.ts:62](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L62)

Get parameters used in this query part

#### Returns

`Record`\<`string`, `any`\>

#### Implementation of

[`QueryPart`](../interfaces/QueryPart.md).[`getParameters`](../interfaces/QueryPart.md#getparameters)
