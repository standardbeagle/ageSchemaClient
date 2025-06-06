[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / getVertexTableName

# Function: getVertexTableName()

```ts
function getVertexTableName(label, prefix): string;
```

Defined in: [src/sql/utils.ts:159](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/utils.ts#L159)

Generate a table name for a vertex label

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Vertex label |
| `prefix` | `string` | `'v_'` | Optional table prefix |

## Returns

`string`

Table name
