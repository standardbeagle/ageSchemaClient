[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / SchemaParserConfig

# Interface: SchemaParserConfig

Defined in: [src/schema/parser.ts:35](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/parser.ts#L35)

Schema parser configuration

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="validateonparse"></a> `validateOnParse?` | `boolean` | Whether to validate the schema after parsing | [src/schema/parser.ts:39](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/parser.ts#L39) |
| <a id="collectallerrors"></a> `collectAllErrors?` | `boolean` | Whether to collect all validation errors instead of failing on the first error | [src/schema/parser.ts:44](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/parser.ts#L44) |
| <a id="validaterelationships"></a> `validateRelationships?` | `boolean` | Whether to validate relationship constraints | [src/schema/parser.ts:49](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/parser.ts#L49) |
| <a id="detectcirculardependencies"></a> `detectCircularDependencies?` | `boolean` | Whether to detect circular dependencies | [src/schema/parser.ts:54](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/parser.ts#L54) |
| <a id="minversion"></a> `minVersion?` | `string` | Minimum supported schema version | [src/schema/parser.ts:59](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/parser.ts#L59) |
| <a id="maxversion"></a> `maxVersion?` | `string` | Maximum supported schema version | [src/schema/parser.ts:64](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/parser.ts#L64) |
