[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / QueryResult

# Interface: QueryResult\<T\>

Defined in: [src/db/query.ts:12](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L12)

Query result

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `any` |

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="rows"></a> `rows` | `T`[] | Result rows | [src/db/query.ts:16](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L16) |
| <a id="rowcount"></a> `rowCount` | `number` | Row count | [src/db/query.ts:21](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L21) |
| <a id="fields"></a> `fields` | `QueryResultField`[] | Field information | [src/db/query.ts:26](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L26) |
| <a id="command"></a> `command` | `string` | Command | [src/db/query.ts:31](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L31) |
| <a id="oid"></a> `oid` | `number` | OID | [src/db/query.ts:36](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L36) |
