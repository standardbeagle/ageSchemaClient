[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / SchemaDefinition

# Interface: SchemaDefinition

Defined in: [src/schema/types.ts:465](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L465)

Top-level schema definition

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="version"></a> `version` | `string` \| [`SchemaVersion`](SchemaVersion.md) | Schema version | [src/schema/types.ts:469](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L469) |
| <a id="vertices"></a> `vertices` | `Record`\<`string`, [`VertexLabel`](VertexLabel.md)\> | Vertex label definitions | [src/schema/types.ts:474](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L474) |
| <a id="edges"></a> `edges` | `Record`\<`string`, [`EdgeLabel`](EdgeLabel.md)\> | Edge label definitions | [src/schema/types.ts:479](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L479) |
| <a id="metadata"></a> `metadata?` | [`SchemaMetadata`](SchemaMetadata.md) | Schema metadata | [src/schema/types.ts:484](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L484) |
