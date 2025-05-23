[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / IEdgeMatchClause

# Interface: IEdgeMatchClause\<T\>

Defined in: [src/query/types.ts:382](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L382)

Edge match clause interface

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](SchemaDefinition.md) |

## Methods

### constraint()

```ts
constraint(properties): this;
```

Defined in: [src/query/types.ts:390](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L390)

Add property constraints to the edge pattern

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | `Record`\<`string`, `any`\> | Object with property-value pairs |

#### Returns

`this`

This edge match clause

#### Throws

Error if any property value is null, undefined, or NaN

***

### where()

```ts
where(condition, params?): this;
```

Defined in: [src/query/types.ts:399](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L399)

Add WHERE clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | `string` | Condition expression |
| `params?` | `Record`\<`string`, `any`\> | Parameters |

#### Returns

`this`

This edge match clause

***

### return()

```ts
return(...expressions): this;
```

Defined in: [src/query/types.ts:404](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L404)

Add RETURN clause

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`expressions` | `string`[] |

#### Returns

`this`

***

### orderBy()

```ts
orderBy(expression, direction?): this;
```

Defined in: [src/query/types.ts:409](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L409)

Add ORDER BY clause

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `expression` | `string` |
| `direction?` | [`OrderDirection`](../enumerations/OrderDirection.md) |

#### Returns

`this`

***

### limit()

```ts
limit(count): this;
```

Defined in: [src/query/types.ts:414](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L414)

Add LIMIT clause

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `count` | `number` |

#### Returns

`this`

***

### skip()

```ts
skip(count): this;
```

Defined in: [src/query/types.ts:419](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L419)

Add SKIP clause

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `count` | `number` |

#### Returns

`this`

***

### with()

```ts
with(...expressions): this;
```

Defined in: [src/query/types.ts:424](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L424)

Add WITH clause

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`expressions` | `string`[] |

#### Returns

`this`

***

### unwind()

```ts
unwind(expression, alias): this;
```

Defined in: [src/query/types.ts:429](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L429)

Add UNWIND clause

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `expression` | `string` |
| `alias` | `string` |

#### Returns

`this`

***

### withParam()

```ts
withParam(name, value): this;
```

Defined in: [src/query/types.ts:434](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L434)

Add a parameter to the query

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `value` | `any` |

#### Returns

`this`

***

### execute()

```ts
execute<R>(options?): QueryBuilderResult<R>;
```

Defined in: [src/query/types.ts:439](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L439)

Execute the query

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `R` | `any` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`QueryExecutionOptions`](QueryExecutionOptions.md) |

#### Returns

[`QueryBuilderResult`](../type-aliases/QueryBuilderResult.md)\<`R`\>

***

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/types.ts:444](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L444)

Get the Cypher query string

#### Returns

`string`

***

### done()

```ts
done(): IQueryBuilder<T>;
```

Defined in: [src/query/types.ts:449](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L449)

Return to the main query builder

#### Returns

[`IQueryBuilder`](IQueryBuilder.md)\<`T`\>
