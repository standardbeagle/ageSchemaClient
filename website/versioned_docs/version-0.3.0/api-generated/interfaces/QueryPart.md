[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / QueryPart

# Interface: QueryPart

Defined in: [src/query/types.ts:32](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L32)

Base query part interface

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`QueryPartType`](/ageSchemaClient/api-generated/enumerations/QueryPartType.md) | Query part type | [src/query/types.ts:36](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L36) |

## Methods

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/types.ts:41](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L41)

Convert to Cypher string

#### Returns

`string`

***

### getParameters()

```ts
getParameters(): Record<string, any>;
```

Defined in: [src/query/types.ts:46](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L46)

Get parameters used in this query part

#### Returns

`Record`\<`string`, `any`\>
