[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / convertToPostgresValue

# Function: convertToPostgresValue()

```ts
function convertToPostgresValue(value, type): SQLParameter;
```

Defined in: [src/sql/utils.ts:65](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/utils.ts#L65)

Convert a JavaScript value to a PostgreSQL value based on property type

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `any` | Value to convert |
| `type` | [`PropertyType`](/ageSchemaClient/api-generated/enumerations/PropertyType.md) | Property type |

## Returns

[`SQLParameter`](/ageSchemaClient/api-generated/type-aliases/SQLParameter.md)

Converted value
