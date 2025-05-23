[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / MigrationPlan

# Interface: MigrationPlan

Defined in: [src/schema/migration-executor.ts:45](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L45)

Migration plan

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="sourceversion"></a> `sourceVersion` | `string` | Source schema version | [src/schema/migration-executor.ts:49](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L49) |
| <a id="targetversion"></a> `targetVersion` | `string` | Target schema version | [src/schema/migration-executor.ts:54](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L54) |
| <a id="steps"></a> `steps` | [`MigrationStep`](MigrationStep.md)[] | Migration steps | [src/schema/migration-executor.ts:59](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L59) |
| <a id="cancausedataloss"></a> `canCauseDataLoss` | `boolean` | Whether the migration can cause data loss | [src/schema/migration-executor.ts:64](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L64) |
