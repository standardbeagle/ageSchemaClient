[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / PropertyDefinition

# Interface: PropertyDefinition

Defined in: [src/schema/types.ts:276](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L276)

Property definition

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | \| [`PropertyType`](../enumerations/PropertyType.md) \| [`PropertyType`](../enumerations/PropertyType.md)[] | Property data type | [src/schema/types.ts:280](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L280) |
| <a id="description"></a> `description?` | `string` | Property description | [src/schema/types.ts:285](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L285) |
| <a id="default"></a> `default?` | `unknown` | Default value | [src/schema/types.ts:290](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L290) |
| <a id="required"></a> `required?` | `boolean` | Whether the property is required | [src/schema/types.ts:295](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L295) |
| <a id="nullable"></a> `nullable?` | `boolean` | Whether the property can be null | [src/schema/types.ts:300](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L300) |
| <a id="stringconstraints"></a> `stringConstraints?` | [`StringConstraints`](StringConstraints.md) | String constraints (for string properties) | [src/schema/types.ts:305](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L305) |
| <a id="numberconstraints"></a> `numberConstraints?` | [`NumberConstraints`](NumberConstraints.md) | Number constraints (for number properties) | [src/schema/types.ts:310](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L310) |
| <a id="arrayconstraints"></a> `arrayConstraints?` | [`ArrayConstraints`](ArrayConstraints.md) | Array constraints (for array properties) | [src/schema/types.ts:315](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L315) |
| <a id="objectconstraints"></a> `objectConstraints?` | [`ObjectConstraints`](ObjectConstraints.md) | Object constraints (for object properties) | [src/schema/types.ts:320](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L320) |
| <a id="customvalidator"></a> `customValidator?` | `string` | Custom validation function name | [src/schema/types.ts:325](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L325) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> | Additional metadata | [src/schema/types.ts:330](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L330) |
