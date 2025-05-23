[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / parameterize

# Function: parameterize()

```ts
function parameterize(sql, params): string;
```

Defined in: [src/sql/utils.ts:142](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/utils.ts#L142)

Generate a parameterized SQL statement with placeholders

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sql` | `string` | SQL statement with $1, $2, etc. placeholders |
| `params` | [`SQLParameters`](/ageSchemaClient/api-generated/type-aliases/SQLParameters.md) | Parameters to bind |

## Returns

`string`

SQL statement with parameters
