[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / getEdgeTableName

# Function: getEdgeTableName()

```ts
function getEdgeTableName(label, prefix): string;
```

Defined in: [src/sql/utils.ts:171](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/utils.ts#L171)

Generate a table name for an edge label

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Edge label |
| `prefix` | `string` | `'e_'` | Optional table prefix |

## Returns

`string`

Table name
