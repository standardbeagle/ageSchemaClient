[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / QueryOptions

# Interface: QueryOptions

Defined in: [src/db/query.ts:82](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L82)

Query options

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="timeout"></a> `timeout?` | `number` | Query timeout in milliseconds **Default** `0 (no timeout)` | [src/db/query.ts:87](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L87) |
| <a id="maxretries"></a> `maxRetries?` | `number` | Maximum number of retry attempts **Default** `0 (no retries)` | [src/db/query.ts:93](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L93) |
| <a id="retrydelay"></a> `retryDelay?` | `number` | Delay between retries in milliseconds **Default** `1000` | [src/db/query.ts:99](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L99) |
| <a id="rowmode"></a> `rowMode?` | `"object"` \| `"array"` | Row mode **Default** `'array'` | [src/db/query.ts:105](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L105) |
| <a id="name"></a> `name?` | `string` | Query name (for prepared statements) | [src/db/query.ts:110](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L110) |
| <a id="transaction"></a> `transaction?` | `any` | Transaction object | [src/db/query.ts:115](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L115) |
