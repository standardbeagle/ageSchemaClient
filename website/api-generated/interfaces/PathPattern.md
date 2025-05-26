[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / PathPattern

# Interface: PathPattern

Defined in: [src/query/types.ts:141](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L141)

Path pattern

## Extends

- [`MatchPattern`](MatchPattern.md)

## Properties

| Property | Type | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`PATH`](../enumerations/MatchPatternType.md#path) | Pattern type | [`MatchPattern`](MatchPattern.md).[`type`](MatchPattern.md#type) | [src/query/types.ts:145](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L145) |
| <a id="alias"></a> `alias` | `string` | Path alias | - | [src/query/types.ts:150](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L150) |
| <a id="segments"></a> `segments` | ([`VertexPattern`](VertexPattern.md) \| [`EdgePattern`](EdgePattern.md))[] | Path segments | - | [src/query/types.ts:155](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L155) |

## Methods

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/types.ts:70](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L70)

Convert to Cypher string

#### Returns

`string`

#### Inherited from

[`MatchPattern`](MatchPattern.md).[`toCypher`](MatchPattern.md#tocypher)
