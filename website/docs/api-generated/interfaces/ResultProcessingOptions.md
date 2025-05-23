[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / ResultProcessingOptions

# Interface: ResultProcessingOptions

Defined in: [src/query/results.ts:12](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L12)

Result processing options

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="flatten"></a> `flatten?` | `boolean` | Whether to flatten nested objects | [src/query/results.ts:16](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L16) |
| <a id="expandpaths"></a> `expandPaths?` | `boolean` | Whether to convert graph paths to arrays of nodes and relationships | [src/query/results.ts:21](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L21) |
| <a id="parsedates"></a> `parseDates?` | `boolean` | Whether to convert date strings to Date objects | [src/query/results.ts:26](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L26) |
| <a id="removenulls"></a> `removeNulls?` | `boolean` | Whether to remove null values from results | [src/query/results.ts:31](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L31) |
| <a id="parsenumbers"></a> `parseNumbers?` | `boolean` | Whether to convert numeric strings to numbers | [src/query/results.ts:36](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L36) |
| <a id="transformers"></a> `transformers?` | `Record`\<`string`, (`value`) => `any`\> | Custom transformers for specific fields | [src/query/results.ts:41](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L41) |
