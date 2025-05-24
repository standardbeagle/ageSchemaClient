[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / EdgeProperties

# Type Alias: EdgeProperties\<E\>

```ts
type EdgeProperties<E> = { [K in keyof E["properties"]]: PropertyTypeOf<E["properties"][K]> };
```

Defined in: [src/schema/utils.ts:70](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/utils.ts#L70)

Extract edge property types

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `E` *extends* [`EdgeLabel`](/ageSchemaClient/api-generated/interfaces/EdgeLabel.md) | Edge label |
