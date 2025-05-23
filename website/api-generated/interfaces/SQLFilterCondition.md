[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / SQLFilterCondition

# Interface: SQLFilterCondition

Defined in: [src/sql/types.ts:79](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/types.ts#L79)

SQL filter condition

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property"></a> `property` | `string` | Property name | [src/sql/types.ts:83](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/types.ts#L83) |
| <a id="operator"></a> `operator` | [`SQLFilterOperator`](../enumerations/SQLFilterOperator.md) | Filter operator | [src/sql/types.ts:88](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/types.ts#L88) |
| <a id="value"></a> `value?` | \| [`SQLParameter`](../type-aliases/SQLParameter.md) \| [`SQLParameter`](../type-aliases/SQLParameter.md)[] | Filter value | [src/sql/types.ts:93](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/types.ts#L93) |
