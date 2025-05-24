[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / ReturnClause

# Class: ReturnClause\<T\>

Defined in: [src/query/clauses.ts:425](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L425)

Return clause implementation

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) |

## Implements

- [`IReturnClause`](/ageSchemaClient/api-generated/interfaces/IReturnClause.md)\<`T`\>

## Constructors

### Constructor

```ts
new ReturnClause<T>(queryBuilder, returnPart): ReturnClause<T>;
```

Defined in: [src/query/clauses.ts:432](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L432)

Create a new return clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `queryBuilder` | [`IQueryBuilder`](/ageSchemaClient/api-generated/interfaces/IQueryBuilder.md)\<`T`\> | Query builder |
| `returnPart` | [`ReturnPart`](/ageSchemaClient/api-generated/classes/ReturnPart.md) | Return part |

#### Returns

`ReturnClause`\<`T`\>

## Methods

### groupBy()

```ts
groupBy(...expressions): IQueryBuilder<T>;
```

Defined in: [src/query/clauses.ts:443](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L443)

Add GROUP BY clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`expressions` | `string`[] | Group by expressions |

#### Returns

[`IQueryBuilder`](/ageSchemaClient/api-generated/interfaces/IQueryBuilder.md)\<`T`\>

Query builder

#### Implementation of

[`IReturnClause`](/ageSchemaClient/api-generated/interfaces/IReturnClause.md).[`groupBy`](/ageSchemaClient/api-generated/interfaces/IReturnClause.md#groupby)

***

### done()

```ts
done(): IQueryBuilder<T>;
```

Defined in: [src/query/clauses.ts:453](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L453)

Return to the main query builder

#### Returns

[`IQueryBuilder`](/ageSchemaClient/api-generated/interfaces/IQueryBuilder.md)\<`T`\>

Query builder

#### Implementation of

[`IReturnClause`](/ageSchemaClient/api-generated/interfaces/IReturnClause.md).[`done`](/ageSchemaClient/api-generated/interfaces/IReturnClause.md#done)
