[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / SchemaVersion

# Interface: SchemaVersion

Defined in: [src/schema/types.ts:90](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L90)

Schema version information

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="major"></a> `major` | `number` | Major version number (incremented for breaking changes) | [src/schema/types.ts:94](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L94) |
| <a id="minor"></a> `minor` | `number` | Minor version number (incremented for backwards-compatible feature additions) | [src/schema/types.ts:99](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L99) |
| <a id="patch"></a> `patch` | `number` | Patch version number (incremented for backwards-compatible bug fixes) | [src/schema/types.ts:104](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L104) |
| <a id="prerelease"></a> `prerelease?` | `string` | Pre-release identifier (e.g., 'alpha', 'beta') | [src/schema/types.ts:109](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L109) |
| <a id="build"></a> `build?` | `string` | Build metadata | [src/schema/types.ts:114](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/types.ts#L114) |
