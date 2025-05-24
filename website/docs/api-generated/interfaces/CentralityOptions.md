[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / CentralityOptions

# Interface: CentralityOptions

Defined in: [src/query/algorithms.ts:64](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L64)

Centrality algorithm options

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="maxdepth"></a> `maxDepth?` | `number` | Maximum path length to consider | [src/query/algorithms.ts:68](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L68) |
| <a id="relationshiptypes"></a> `relationshipTypes?` | `string`[] | Relationship types to traverse | [src/query/algorithms.ts:73](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L73) |
| <a id="costproperty"></a> `costProperty?` | `string` | Cost property for weighted algorithms | [src/query/algorithms.ts:78](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L78) |
| <a id="defaultcost"></a> `defaultCost?` | `number` | Default cost for relationships without cost property | [src/query/algorithms.ts:83](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L83) |
| <a id="normalize"></a> `normalize?` | `boolean` | Whether to normalize results (0-1 range) | [src/query/algorithms.ts:88](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L88) |
