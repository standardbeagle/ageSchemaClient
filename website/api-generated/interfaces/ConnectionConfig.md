[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / ConnectionConfig

# Interface: ConnectionConfig

Defined in: [src/core/types.ts:30](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L30)

Database connection configuration

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="host"></a> `host` | `string` | Database host | [src/core/types.ts:34](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L34) |
| <a id="port"></a> `port` | `number` | Database port | [src/core/types.ts:39](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L39) |
| <a id="database"></a> `database` | `string` | Database name | [src/core/types.ts:44](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L44) |
| <a id="user"></a> `user` | `string` | Database user | [src/core/types.ts:49](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L49) |
| <a id="password"></a> `password` | `string` | Database password | [src/core/types.ts:54](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L54) |
| <a id="ssl"></a> `ssl?` | `boolean` \| [`SSLConfig`](SSLConfig.md) | SSL configuration | [src/core/types.ts:59](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L59) |
| <a id="pgoptions"></a> `pgOptions?` | `object` | PostgreSQL-specific connection options | [src/core/types.ts:64](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L64) |
| `pgOptions.searchPath?` | `string` | Search path for PostgreSQL schemas **Default** `"ag_catalog, public"` | [src/core/types.ts:69](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L69) |
| `pgOptions.applicationName?` | `string` | Application name | [src/core/types.ts:74](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L74) |
| `pgOptions.statementTimeout?` | `number` | Statement timeout in milliseconds | [src/core/types.ts:79](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L79) |
| `pgOptions.queryTimeout?` | `number` | Query timeout in milliseconds | [src/core/types.ts:84](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L84) |
| `pgOptions.idleInTransactionSessionTimeout?` | `number` | Idle in transaction session timeout in milliseconds | [src/core/types.ts:89](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/types.ts#L89) |
