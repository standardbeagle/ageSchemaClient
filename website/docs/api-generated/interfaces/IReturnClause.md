[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / IReturnClause

# Interface: IReturnClause\<T\>

Defined in: [src/query/types.ts:455](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L455)

Return clause interface

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) |

## Methods

### groupBy()

```ts
groupBy(...expressions): IQueryBuilder<T>;
```

Defined in: [src/query/types.ts:459](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L459)

Add GROUP BY clause

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`expressions` | `string`[] |

#### Returns

[`IQueryBuilder`](/ageSchemaClient/api-generated/interfaces/IQueryBuilder.md)\<`T`\>

***

### done()

```ts
done(): IQueryBuilder<T>;
```

Defined in: [src/query/types.ts:464](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L464)

Return to the main query builder

#### Returns

[`IQueryBuilder`](/ageSchemaClient/api-generated/interfaces/IQueryBuilder.md)\<`T`\>
