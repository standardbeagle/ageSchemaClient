[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / SchemaMigrationExecutor

# Class: SchemaMigrationExecutor

Defined in: [src/schema/migration-executor.ts:164](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L164)

Schema migration executor

## Constructors

### Constructor

```ts
new SchemaMigrationExecutor(
   queryExecutor, 
   sqlGenerator, 
   options): SchemaMigrationExecutor;
```

Defined in: [src/schema/migration-executor.ts:177](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L177)

Create a new schema migration executor

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `queryExecutor` | [`QueryExecutor`](/ageSchemaClient/api-generated/classes/QueryExecutor.md) | Query executor |
| `sqlGenerator` | [`SQLGenerator`](/ageSchemaClient/api-generated/classes/SQLGenerator.md) | SQL generator |
| `options` | [`SchemaMigrationExecutorOptions`](/ageSchemaClient/api-generated/interfaces/SchemaMigrationExecutorOptions.md) | Migration executor options |

#### Returns

`SchemaMigrationExecutor`

## Methods

### createMigrationPlan()

```ts
createMigrationPlan(
   sourceSchema, 
   targetSchema, 
   options): MigrationPlan;
```

Defined in: [src/schema/migration-executor.ts:193](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L193)

Create a migration plan

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourceSchema` | [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) | Source schema |
| `targetSchema` | [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) | Target schema |
| `options` | [`MigrationOptions`](/ageSchemaClient/api-generated/interfaces/MigrationOptions.md) | Migration options |

#### Returns

[`MigrationPlan`](/ageSchemaClient/api-generated/interfaces/MigrationPlan.md)

Migration plan

***

### executeMigrationPlan()

```ts
executeMigrationPlan(plan, options): Promise<MigrationResult>;
```

Defined in: [src/schema/migration-executor.ts:235](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration-executor.ts#L235)

Execute a migration plan

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `plan` | [`MigrationPlan`](/ageSchemaClient/api-generated/interfaces/MigrationPlan.md) | Migration plan |
| `options` | [`MigrationOptions`](/ageSchemaClient/api-generated/interfaces/MigrationOptions.md) | Migration options |

#### Returns

`Promise`\<[`MigrationResult`](/ageSchemaClient/api-generated/interfaces/MigrationResult.md)\>

Migration result
