[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / QueryPlanNode

# Interface: QueryPlanNode

Defined in: [src/query/visualization.ts:143](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L143)

Query plan node

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `string` | Node ID | [src/query/visualization.ts:147](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L147) |
| <a id="type"></a> `type` | `string` | Node type | [src/query/visualization.ts:152](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L152) |
| <a id="details"></a> `details` | `Record`\<`string`, `any`\> | Node details | [src/query/visualization.ts:157](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L157) |
| <a id="children"></a> `children?` | `QueryPlanNode`[] | Child nodes | [src/query/visualization.ts:162](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L162) |
| <a id="estimatedrows"></a> `estimatedRows?` | `number` | Estimated rows | [src/query/visualization.ts:167](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L167) |
| <a id="actualrows"></a> `actualRows?` | `number` | Actual rows | [src/query/visualization.ts:172](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L172) |
| <a id="executiontime"></a> `executionTime?` | `number` | Execution time (ms) | [src/query/visualization.ts:177](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L177) |
