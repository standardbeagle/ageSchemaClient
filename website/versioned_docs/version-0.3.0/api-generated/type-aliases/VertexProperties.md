[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / VertexProperties

# Type Alias: VertexProperties\<V\>

```ts
type VertexProperties<V> = { [K in keyof V["properties"]]: PropertyTypeOf<V["properties"][K]> };
```

Defined in: [src/schema/utils.ts:61](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/utils.ts#L61)

Extract vertex property types

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `V` *extends* [`VertexLabel`](/ageSchemaClient/api-generated/interfaces/VertexLabel.md) | Vertex label |
