[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / RequiredProperties

# Type Alias: RequiredProperties\<T, K\>

```ts
type RequiredProperties<T, K> = T & { [P in K]-?: T[P] };
```

Defined in: [src/schema/utils.ts:94](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/utils.ts#L94)

Make certain properties required

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | Object type |
| `K` *extends* keyof `T` | Keys to make required |
