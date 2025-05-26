[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / IReturnClause

# Interface: IReturnClause\<T\>

Defined in: [src/query/types.ts:456](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L456)

Return clause interface

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](SchemaDefinition.md) |

## Methods

### groupBy()

```ts
groupBy(...expressions): IQueryBuilder<T>;
```

Defined in: [src/query/types.ts:460](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L460)

Add GROUP BY clause

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`expressions` | `string`[] |

#### Returns

[`IQueryBuilder`](IQueryBuilder.md)\<`T`\>

***

### done()

```ts
done(): IQueryBuilder<T>;
```

Defined in: [src/query/types.ts:465](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L465)

Return to the main query builder

#### Returns

[`IQueryBuilder`](IQueryBuilder.md)\<`T`\>
