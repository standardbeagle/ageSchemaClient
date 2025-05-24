[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / ExtractEdgeType

# Type Alias: ExtractEdgeType\<S, L\>

```ts
type ExtractEdgeType<S, L> = S["edges"][L];
```

Defined in: [src/schema/utils.ts:33](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/utils.ts#L33)

Extract an edge type from a schema

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `S` *extends* [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) | Schema definition type |
| `L` *extends* keyof `S`\[`"edges"`\] | Edge label |
