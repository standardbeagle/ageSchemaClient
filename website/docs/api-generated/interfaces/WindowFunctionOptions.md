[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / WindowFunctionOptions

# Interface: WindowFunctionOptions

Defined in: [src/query/analytics.ts:257](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L257)

Window function options

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="partitionby"></a> `partitionBy?` | `string`[] | Partition by expressions | [src/query/analytics.ts:261](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L261) |
| <a id="orderby"></a> `orderBy?` | `object`[] | Order by expressions with direction | [src/query/analytics.ts:266](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L266) |
| <a id="frame"></a> `frame?` | `object` | Frame specification (for certain window functions) | [src/query/analytics.ts:274](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L274) |
| `frame.type` | `"ROWS"` \| `"RANGE"` | - | [src/query/analytics.ts:275](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L275) |
| `frame.start` | `number` \| `"UNBOUNDED PRECEDING"` \| `"CURRENT ROW"` | - | [src/query/analytics.ts:276](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L276) |
| `frame.end` | `number` \| `"CURRENT ROW"` \| `"UNBOUNDED FOLLOWING"` | - | [src/query/analytics.ts:277](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L277) |
| <a id="args"></a> `args?` | `any`[] | Additional arguments for specific window functions | [src/query/analytics.ts:283](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L283) |
