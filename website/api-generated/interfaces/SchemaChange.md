[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / SchemaChange

# Interface: SchemaChange

Defined in: [src/schema/migration.ts:29](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration.ts#L29)

Schema change

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`SchemaChangeType`](../enumerations/SchemaChangeType.md) | Change type | [src/schema/migration.ts:33](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration.ts#L33) |
| <a id="path"></a> `path` | `string` | Path to the changed element | [src/schema/migration.ts:38](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration.ts#L38) |
| <a id="breaking"></a> `breaking` | `boolean` | Whether the change is breaking | [src/schema/migration.ts:43](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration.ts#L43) |
| <a id="oldvalue"></a> `oldValue?` | `unknown` | Old value | [src/schema/migration.ts:48](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration.ts#L48) |
| <a id="newvalue"></a> `newValue?` | `unknown` | New value | [src/schema/migration.ts:53](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/migration.ts#L53) |
