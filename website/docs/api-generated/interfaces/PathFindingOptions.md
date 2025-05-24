[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / PathFindingOptions

# Interface: PathFindingOptions

Defined in: [src/query/algorithms.ts:34](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L34)

Path finding options

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="maxdepth"></a> `maxDepth?` | `number` | Maximum path length | [src/query/algorithms.ts:38](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L38) |
| <a id="relationshiptypes"></a> `relationshipTypes?` | `string`[] | Relationship types to traverse | [src/query/algorithms.ts:43](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L43) |
| <a id="costproperty"></a> `costProperty?` | `string` | Cost property for weighted path algorithms | [src/query/algorithms.ts:48](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L48) |
| <a id="defaultcost"></a> `defaultCost?` | `number` | Default cost for relationships without cost property | [src/query/algorithms.ts:53](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L53) |
| <a id="includerelationshipproperties"></a> `includeRelationshipProperties?` | `boolean` | Whether to include relationship properties in the result | [src/query/algorithms.ts:58](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L58) |
