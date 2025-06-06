[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / ObjectConstraints

# Interface: ObjectConstraints

Defined in: [src/schema/types.ts:256](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L256)

Object property constraints

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="required"></a> `required?` | `string`[] | Required properties | [src/schema/types.ts:260](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L260) |
| <a id="properties"></a> `properties?` | `Record`\<`string`, [`PropertyDefinition`](/ageSchemaClient/api-generated/interfaces/PropertyDefinition.md)\> | Property definitions | [src/schema/types.ts:265](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L265) |
| <a id="additionalproperties"></a> `additionalProperties?` | \| `boolean` \| [`PropertyDefinition`](/ageSchemaClient/api-generated/interfaces/PropertyDefinition.md) | Additional properties schema | [src/schema/types.ts:270](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L270) |
