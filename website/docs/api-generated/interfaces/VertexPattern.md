[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / VertexPattern

# Interface: VertexPattern

Defined in: [src/query/types.ts:76](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L76)

Vertex pattern

## Extends

- [`MatchPattern`](/ageSchemaClient/api-generated/interfaces/MatchPattern.md)

## Properties

| Property | Type | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`VERTEX`](/ageSchemaClient/api-generated/enumerations/MatchPatternType.md#vertex) | Pattern type | [`MatchPattern`](/ageSchemaClient/api-generated/interfaces/MatchPattern.md).[`type`](/ageSchemaClient/api-generated/interfaces/MatchPattern.md#type) | [src/query/types.ts:80](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L80) |
| <a id="label"></a> `label` | `string` | Vertex label | - | [src/query/types.ts:85](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L85) |
| <a id="alias"></a> `alias` | `string` | Vertex alias | - | [src/query/types.ts:90](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L90) |
| <a id="properties"></a> `properties?` | `Record`\<`string`, `any`\> | Property constraints | - | [src/query/types.ts:95](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L95) |

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

[`MatchPattern`](/ageSchemaClient/api-generated/interfaces/MatchPattern.md).[`toCypher`](/ageSchemaClient/api-generated/interfaces/MatchPattern.md#tocypher)
