[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / SkipPart

# Class: SkipPart

Defined in: [src/query/parts.ts:323](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L323)

SKIP query part

## Extends

- [`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md)

## Constructors

### Constructor

```ts
new SkipPart(count): SkipPart;
```

Defined in: [src/query/parts.ts:339](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L339)

Create a new SKIP part

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `count` | `number` | Skip count |

#### Returns

`SkipPart`

#### Overrides

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`constructor`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#constructor)

## Properties

| Property | Type | Default value | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`QueryPartType`](/ageSchemaClient/api-generated/enumerations/QueryPartType.md) | `QueryPartType.SKIP` | Query part type | [`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`type`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#type) | [src/query/parts.ts:327](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L327) |

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

Defined in: [src/query/parts.ts:347](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L347)

Convert to Cypher string

#### Returns

`string`

#### Overrides

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`toCypher`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#tocypher)
