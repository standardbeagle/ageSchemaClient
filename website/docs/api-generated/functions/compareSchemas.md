[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / compareSchemas

# Function: compareSchemas()

```ts
function compareSchemas(oldSchema, newSchema): SchemaChange[];
```

Defined in: [src/schema/migration.ts:92](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration.ts#L92)

Compare two schemas and identify changes

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `oldSchema` | [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) | Old schema |
| `newSchema` | [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) | New schema |

## Returns

[`SchemaChange`](/ageSchemaClient/api-generated/interfaces/SchemaChange.md)[]

Array of schema changes
