[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / migrateSchema

# Function: migrateSchema()

```ts
function migrateSchema(
   oldSchema, 
   newSchema, 
   options): SchemaDefinition;
```

Defined in: [src/schema/migration.ts:496](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration.ts#L496)

Migrate a schema to a new version

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `oldSchema` | [`SchemaDefinition`](../interfaces/SchemaDefinition.md) | Old schema |
| `newSchema` | [`SchemaDefinition`](../interfaces/SchemaDefinition.md) | New schema |
| `options` | [`SchemaMigrationOptions`](../interfaces/SchemaMigrationOptions.md) | Migration options |

## Returns

[`SchemaDefinition`](../interfaces/SchemaDefinition.md)

Migrated schema

## Throws

SchemaVersionError if migration is not possible
