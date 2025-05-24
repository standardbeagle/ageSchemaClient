[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / MigrationStep

# Interface: MigrationStep

Defined in: [src/schema/migration-executor.ts:20](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L20)

Migration step

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="description"></a> `description` | `string` | Step description | [src/schema/migration-executor.ts:24](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L24) |
| <a id="sql"></a> `sql` | `string` | SQL statement | [src/schema/migration-executor.ts:29](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L29) |
| <a id="params"></a> `params` | `any`[] | SQL parameters | [src/schema/migration-executor.ts:34](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L34) |
| <a id="cancausedataloss"></a> `canCauseDataLoss` | `boolean` | Whether this step can cause data loss | [src/schema/migration-executor.ts:39](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L39) |
