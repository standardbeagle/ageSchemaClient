[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / MatchPattern

# Interface: MatchPattern

Defined in: [src/query/types.ts:61](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L61)

Match pattern interface

## Extended by

- [`VertexPattern`](/ageSchemaClient/api-generated/interfaces/VertexPattern.md)
- [`EdgePattern`](/ageSchemaClient/api-generated/interfaces/EdgePattern.md)
- [`PathPattern`](/ageSchemaClient/api-generated/interfaces/PathPattern.md)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`MatchPatternType`](/ageSchemaClient/api-generated/enumerations/MatchPatternType.md) | Pattern type | [src/query/types.ts:65](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L65) |

## Methods

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/types.ts:70](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L70)

Convert to Cypher string

#### Returns

`string`
