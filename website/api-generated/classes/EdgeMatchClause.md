[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / EdgeMatchClause

# Class: EdgeMatchClause\<T\>

Defined in: [src/query/clauses.ts:252](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L252)

Edge match clause implementation

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](../interfaces/SchemaDefinition.md) |

## Implements

- [`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md)\<`T`\>

## Constructors

### Constructor

```ts
new EdgeMatchClause<T>(
   queryBuilder, 
   matchPart, 
edgePattern): EdgeMatchClause<T>;
```

Defined in: [src/query/clauses.ts:260](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L260)

Create a new edge match clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `queryBuilder` | [`IQueryBuilder`](../interfaces/IQueryBuilder.md)\<`T`\> | Query builder |
| `matchPart` | [`MatchPart`](MatchPart.md) | Match part |
| `edgePattern` | [`EdgePattern`](../interfaces/EdgePattern.md) | Edge pattern |

#### Returns

`EdgeMatchClause`\<`T`\>

## Methods

### constraint()

```ts
constraint(properties): this;
```

Defined in: [src/query/clauses.ts:273](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L273)

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

#### Implementation of

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md).[`constraint`](../interfaces/IEdgeMatchClause.md#constraint)

***

### where()

```ts
where(condition, params?): this;
```

Defined in: [src/query/clauses.ts:307](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L307)

Add WHERE clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | `string` | Condition expression |
| `params?` | `Record`\<`string`, `any`\> | Parameters |

#### Returns

`this`

This edge match clause

#### Implementation of

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md).[`where`](../interfaces/IEdgeMatchClause.md#where)

***

### return()

```ts
return(...expressions): this;
```

Defined in: [src/query/clauses.ts:319](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L319)

Add RETURN clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`expressions` | `string`[] | Return expressions |

#### Returns

`this`

This edge match clause

#### Implementation of

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md).[`return`](../interfaces/IEdgeMatchClause.md#return)

***

### orderBy()

```ts
orderBy(expression, direction?): this;
```

Defined in: [src/query/clauses.ts:331](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L331)

Add ORDER BY clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `expression` | `string` | Expression to order by |
| `direction?` | [`OrderDirection`](../enumerations/OrderDirection.md) | Order direction |

#### Returns

`this`

This edge match clause

#### Implementation of

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md).[`orderBy`](../interfaces/IEdgeMatchClause.md#orderby)

***

### limit()

```ts
limit(count): this;
```

Defined in: [src/query/clauses.ts:342](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L342)

Add LIMIT clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `count` | `number` | Limit count |

#### Returns

`this`

This edge match clause

#### Implementation of

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md).[`limit`](../interfaces/IEdgeMatchClause.md#limit)

***

### skip()

```ts
skip(count): this;
```

Defined in: [src/query/clauses.ts:353](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L353)

Add SKIP clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `count` | `number` | Skip count |

#### Returns

`this`

This edge match clause

#### Implementation of

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md).[`skip`](../interfaces/IEdgeMatchClause.md#skip)

***

### with()

```ts
with(...expressions): this;
```

Defined in: [src/query/clauses.ts:364](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L364)

Add WITH clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`expressions` | `string`[] | With expressions |

#### Returns

`this`

This edge match clause

#### Implementation of

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md).[`with`](../interfaces/IEdgeMatchClause.md#with)

***

### unwind()

```ts
unwind(expression, alias): this;
```

Defined in: [src/query/clauses.ts:376](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L376)

Add UNWIND clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `expression` | `string` | Expression to unwind |
| `alias` | `string` | Alias for unwound items |

#### Returns

`this`

This edge match clause

#### Implementation of

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md).[`unwind`](../interfaces/IEdgeMatchClause.md#unwind)

***

### withParam()

```ts
withParam(name, value): this;
```

Defined in: [src/query/clauses.ts:388](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L388)

Add a parameter to the query

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Parameter name |
| `value` | `any` | Parameter value |

#### Returns

`this`

This edge match clause

#### Implementation of

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md).[`withParam`](../interfaces/IEdgeMatchClause.md#withparam)

***

### execute()

```ts
execute<R>(options?): QueryBuilderResult<R>;
```

Defined in: [src/query/clauses.ts:399](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L399)

Execute the query

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `R` | `any` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`QueryExecutionOptions`](../interfaces/QueryExecutionOptions.md) | Query execution options |

#### Returns

[`QueryBuilderResult`](../type-aliases/QueryBuilderResult.md)\<`R`\>

Query result

#### Implementation of

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md).[`execute`](../interfaces/IEdgeMatchClause.md#execute)

***

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/clauses.ts:408](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L408)

Get the Cypher query string

#### Returns

`string`

Cypher query string

#### Implementation of

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md).[`toCypher`](../interfaces/IEdgeMatchClause.md#tocypher)

***

### done()

```ts
done(): IQueryBuilder<T>;
```

Defined in: [src/query/clauses.ts:417](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L417)

Return to the main query builder

#### Returns

[`IQueryBuilder`](../interfaces/IQueryBuilder.md)\<`T`\>

Query builder

#### Implementation of

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md).[`done`](../interfaces/IEdgeMatchClause.md#done)
