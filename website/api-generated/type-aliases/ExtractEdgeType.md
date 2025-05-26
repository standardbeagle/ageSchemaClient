[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / ExtractEdgeType

# Type Alias: ExtractEdgeType\<S, L\>

```ts
type ExtractEdgeType<S, L> = S["edges"][L];
```

Defined in: [src/schema/utils.ts:33](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/utils.ts#L33)

Extract an edge type from a schema

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `S` *extends* [`SchemaDefinition`](../interfaces/SchemaDefinition.md) | Schema definition type |
| `L` *extends* keyof `S`\[`"edges"`\] | Edge label |
