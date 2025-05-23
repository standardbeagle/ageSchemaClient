[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / MigrationResult

# Interface: MigrationResult

Defined in: [src/schema/migration-executor.ts:70](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L70)

Migration result

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="success"></a> `success` | `boolean` | Whether the migration was successful | [src/schema/migration-executor.ts:74](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L74) |
| <a id="error"></a> `error?` | `string` | Error message if migration failed | [src/schema/migration-executor.ts:79](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L79) |
| <a id="plan"></a> `plan` | [`MigrationPlan`](MigrationPlan.md) | Migration plan | [src/schema/migration-executor.ts:84](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L84) |
| <a id="executedsteps"></a> `executedSteps` | `number` | Executed steps | [src/schema/migration-executor.ts:89](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L89) |
| <a id="totalsteps"></a> `totalSteps` | `number` | Total steps | [src/schema/migration-executor.ts:94](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L94) |
