[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / EdgePattern

# Interface: EdgePattern

Defined in: [src/query/types.ts:101](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L101)

Edge pattern

## Extends

- [`MatchPattern`](MatchPattern.md)

## Properties

| Property | Type | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`EDGE`](../enumerations/MatchPatternType.md#edge) | Pattern type | [`MatchPattern`](MatchPattern.md).[`type`](MatchPattern.md#type) | [src/query/types.ts:105](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L105) |
| <a id="label"></a> `label` | `string` | Edge label | - | [src/query/types.ts:110](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L110) |
| <a id="alias"></a> `alias` | `string` | Edge alias | - | [src/query/types.ts:115](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L115) |
| <a id="fromvertex"></a> `fromVertex` | [`VertexPattern`](VertexPattern.md) | Source vertex pattern | - | [src/query/types.ts:120](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L120) |
| <a id="tovertex"></a> `toVertex` | [`VertexPattern`](VertexPattern.md) | Target vertex pattern | - | [src/query/types.ts:125](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L125) |
| <a id="direction"></a> `direction` | `"OUTGOING"` \| `"INCOMING"` \| `"BIDIRECTIONAL"` | Edge direction | - | [src/query/types.ts:130](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L130) |
| <a id="properties"></a> `properties?` | `Record`\<`string`, `any`\> | Property constraints | - | [src/query/types.ts:135](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L135) |

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
