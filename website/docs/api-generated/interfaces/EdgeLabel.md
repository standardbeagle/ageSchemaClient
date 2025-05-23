[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / EdgeLabel

# Interface: EdgeLabel

Defined in: [src/schema/types.ts:395](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L395)

Edge label definition

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="label"></a> `label` | `string` | Edge label | [src/schema/types.ts:399](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L399) |
| <a id="properties"></a> `properties` | `Record`\<`string`, [`PropertyDefinition`](/ageSchemaClient/api-generated/interfaces/PropertyDefinition.md)\> | Edge properties | [src/schema/types.ts:404](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L404) |
| <a id="required"></a> `required?` | `string`[] | Required properties | [src/schema/types.ts:409](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L409) |
| <a id="fromvertex"></a> `fromVertex` | \| `string` \| [`VertexConnectionConstraint`](/ageSchemaClient/api-generated/interfaces/VertexConnectionConstraint.md) | Source vertex constraint | [src/schema/types.ts:414](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L414) |
| <a id="tovertex"></a> `toVertex` | \| `string` \| [`VertexConnectionConstraint`](/ageSchemaClient/api-generated/interfaces/VertexConnectionConstraint.md) | Target vertex constraint | [src/schema/types.ts:419](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L419) |
| <a id="from"></a> `from` | `string` | Source vertex type | [src/schema/types.ts:424](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L424) |
| <a id="to"></a> `to` | `string` | Target vertex type | [src/schema/types.ts:429](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L429) |
| <a id="fromlabel"></a> `fromLabel` | `string` | Source vertex label | [src/schema/types.ts:434](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L434) |
| <a id="tolabel"></a> `toLabel` | `string` | Target vertex label | [src/schema/types.ts:439](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L439) |
| <a id="multiplicity"></a> `multiplicity?` | [`EdgeMultiplicity`](/ageSchemaClient/api-generated/enumerations/EdgeMultiplicity.md) | Edge multiplicity | [src/schema/types.ts:444](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L444) |
| <a id="direction"></a> `direction?` | [`EdgeDirection`](/ageSchemaClient/api-generated/enumerations/EdgeDirection.md) | Edge direction | [src/schema/types.ts:449](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L449) |
| <a id="description"></a> `description?` | `string` | Edge description | [src/schema/types.ts:454](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L454) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> | Additional metadata | [src/schema/types.ts:459](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L459) |
