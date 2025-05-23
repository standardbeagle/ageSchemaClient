[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / MatchPattern

# Interface: MatchPattern

Defined in: [src/query/types.ts:61](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L61)

Match pattern interface

## Extended by

- [`VertexPattern`](VertexPattern.md)
- [`EdgePattern`](EdgePattern.md)
- [`PathPattern`](PathPattern.md)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`MatchPatternType`](../enumerations/MatchPatternType.md) | Pattern type | [src/query/types.ts:65](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L65) |

## Methods

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/types.ts:70](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L70)

Convert to Cypher string

#### Returns

`string`
