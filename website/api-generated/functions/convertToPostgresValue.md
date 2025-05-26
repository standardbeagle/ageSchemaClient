[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / convertToPostgresValue

# Function: convertToPostgresValue()

```ts
function convertToPostgresValue(value, type): any;
```

Defined in: [src/sql/utils.ts:66](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/utils.ts#L66)

Convert a JavaScript value to a PostgreSQL value based on property type

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `any` | Value to convert |
| `type` | [`PropertyType`](../enumerations/PropertyType.md) | Property type |

## Returns

`any`

Converted value
