[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / parameterize

# Function: parameterize()

```ts
function parameterize(sql, params): string;
```

Defined in: [src/sql/utils.ts:143](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/utils.ts#L143)

Generate a parameterized SQL statement with placeholders

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sql` | `string` | SQL statement with $1, $2, etc. placeholders |
| `params` | [`SQLParameters`](../type-aliases/SQLParameters.md) | Parameters to bind |

## Returns

`string`

SQL statement with parameters
