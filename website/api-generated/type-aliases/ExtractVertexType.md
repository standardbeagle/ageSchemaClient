[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / ExtractVertexType

# Type Alias: ExtractVertexType\<S, L\>

```ts
type ExtractVertexType<S, L> = S["vertices"][L];
```

Defined in: [src/schema/utils.ts:22](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/utils.ts#L22)

Extract a vertex type from a schema

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `S` *extends* [`SchemaDefinition`](../interfaces/SchemaDefinition.md) | Schema definition type |
| `L` *extends* keyof `S`\[`"vertices"`\] | Vertex label |
