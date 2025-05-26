[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / getVertexTableName

# Function: getVertexTableName()

```ts
function getVertexTableName(label, prefix): string;
```

Defined in: [src/sql/utils.ts:160](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/utils.ts#L160)

Generate a table name for a vertex label

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Vertex label |
| `prefix` | `string` | `'v_'` | Optional table prefix |

## Returns

`string`

Table name
