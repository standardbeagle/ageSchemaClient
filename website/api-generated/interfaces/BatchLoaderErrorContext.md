[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / BatchLoaderErrorContext

# Interface: BatchLoaderErrorContext

Defined in: [src/core/errors.ts:109](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/errors.ts#L109)

Context information for batch loader errors

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="phase"></a> `phase?` | `"transaction"` \| `"vertices"` \| `"edges"` \| `"validation"` \| `"cleanup"` | Phase of the batch loading process where the error occurred | [src/core/errors.ts:113](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/errors.ts#L113) |
| <a id="type"></a> `type?` | `string` | Entity type (vertex or edge type) being processed when the error occurred | [src/core/errors.ts:118](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/errors.ts#L118) |
| <a id="index"></a> `index?` | `number` | Index of the entity in the array being processed | [src/core/errors.ts:123](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/errors.ts#L123) |
| <a id="sql"></a> `sql?` | `string` | SQL or Cypher query being executed when the error occurred | [src/core/errors.ts:128](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/errors.ts#L128) |
| <a id="data"></a> `data?` | `any` | Data being processed when the error occurred | [src/core/errors.ts:133](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/errors.ts#L133) |
