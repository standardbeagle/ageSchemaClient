[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / EdgeDefinition

# Interface: EdgeDefinition

Defined in: [src/schema/types.ts:40](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L40)

Edge definition interface

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="label"></a> `label` | `string` | Edge label | [src/schema/types.ts:44](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L44) |
| <a id="properties"></a> `properties` | `Record`\<`string`, [`PropertyDefinition`](PropertyDefinition.md)\> | Edge properties | [src/schema/types.ts:49](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L49) |
| <a id="from"></a> `from` | `string` | Source vertex type | [src/schema/types.ts:54](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L54) |
| <a id="to"></a> `to` | `string` | Target vertex type | [src/schema/types.ts:59](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L59) |
| <a id="fromlabel"></a> `fromLabel` | `string` | Source vertex label | [src/schema/types.ts:64](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L64) |
| <a id="tolabel"></a> `toLabel` | `string` | Target vertex label | [src/schema/types.ts:69](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L69) |
| <a id="required"></a> `required?` | `string`[] | Required properties | [src/schema/types.ts:74](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L74) |
| <a id="description"></a> `description?` | `string` | Edge description | [src/schema/types.ts:79](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L79) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> | Additional metadata | [src/schema/types.ts:84](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L84) |
