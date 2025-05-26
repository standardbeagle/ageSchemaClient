[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / QueryBuilder

# Class: QueryBuilder\<T\>

Defined in: [src/query/builder.ts:37](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L37)

Query builder class

## Extended by

- [`PathQueryBuilder`](PathQueryBuilder.md)
- [`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](../interfaces/SchemaDefinition.md) |

## Implements

- [`IQueryBuilder`](../interfaces/IQueryBuilder.md)\<`T`\>

## Constructors

### Constructor

```ts
new QueryBuilder<T>(
   schema, 
   queryExecutor, 
graphName): QueryBuilder<T>;
```

Defined in: [src/query/builder.ts:60](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L60)

Create a new query builder

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `schema` | `T` | `undefined` | Schema definition |
| `queryExecutor` | [`QueryExecutor`](QueryExecutor.md) | `undefined` | Query executor |
| `graphName` | `string` | `'default'` | Graph name |

#### Returns

`QueryBuilder`\<`T`\>

## Methods

### match()

Implementation of the match method

#### Call Signature

```ts
match<L>(label, alias): IMatchClause<T, L>;
```

Defined in: [src/query/builder.ts:71](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L71)

Add MATCH clause for a vertex

##### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `label` | `L` |
| `alias` | `string` |

##### Returns

[`IMatchClause`](../interfaces/IMatchClause.md)\<`T`, `L`\>

##### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`match`](../interfaces/IQueryBuilder.md#match)

#### Call Signature

```ts
match<E>(
   sourceAlias, 
   edgeLabel, 
targetAlias): IEdgeMatchClause<T>;
```

Defined in: [src/query/builder.ts:76](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L76)

Add MATCH clause for an edge between two previously matched vertices

##### Type Parameters

| Type Parameter |
| ------ |
| `E` *extends* `string` \| `number` \| `symbol` |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourceAlias` | `string` |
| `edgeLabel` | `E` |
| `targetAlias` | `string` |

##### Returns

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md)\<`T`\>

##### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`match`](../interfaces/IQueryBuilder.md#match)

#### Call Signature

```ts
match<E>(
   sourceAlias, 
   edgeLabel, 
   targetAlias, 
edgeAlias): IEdgeMatchClause<T>;
```

Defined in: [src/query/builder.ts:85](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L85)

Add MATCH clause for an edge between two previously matched vertices with an edge alias

##### Type Parameters

| Type Parameter |
| ------ |
| `E` *extends* `string` \| `number` \| `symbol` |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourceAlias` | `string` |
| `edgeLabel` | `E` |
| `targetAlias` | `string` |
| `edgeAlias` | `string` |

##### Returns

[`IEdgeMatchClause`](../interfaces/IEdgeMatchClause.md)\<`T`\>

##### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`match`](../interfaces/IQueryBuilder.md#match)

***

### where()

```ts
where(condition, params): this;
```

Defined in: [src/query/builder.ts:234](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L234)

Add WHERE clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | `string` | Condition expression |
| `params` | `Record`\<`string`, `any`\> | Parameters |

#### Returns

`this`

This query builder

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`where`](../interfaces/IQueryBuilder.md#where)

***

### return()

```ts
return(...expressions): this;
```

Defined in: [src/query/builder.ts:278](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L278)

Add RETURN clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`expressions` | `string`[] | Return expressions |

#### Returns

`this`

This query builder

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`return`](../interfaces/IQueryBuilder.md#return)

***

### orderBy()

```ts
orderBy(expression, direction): this;
```

Defined in: [src/query/builder.ts:290](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L290)

Add ORDER BY clause

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `expression` | `string` | `undefined` | Expression to order by |
| `direction` | [`OrderDirection`](../enumerations/OrderDirection.md) | `OrderDirection.ASC` | Order direction |

#### Returns

`this`

This query builder

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`orderBy`](../interfaces/IQueryBuilder.md#orderby)

***

### limit()

```ts
limit(count): this;
```

Defined in: [src/query/builder.ts:311](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L311)

Add LIMIT clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `count` | `number` | Limit count |

#### Returns

`this`

This query builder

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`limit`](../interfaces/IQueryBuilder.md#limit)

***

### skip()

```ts
skip(count): this;
```

Defined in: [src/query/builder.ts:322](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L322)

Add SKIP clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `count` | `number` | Skip count |

#### Returns

`this`

This query builder

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`skip`](../interfaces/IQueryBuilder.md#skip)

***

### with()

```ts
with(...expressions): this;
```

Defined in: [src/query/builder.ts:333](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L333)

Add WITH clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`expressions` | `string`[] | With expressions |

#### Returns

`this`

This query builder

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`with`](../interfaces/IQueryBuilder.md#with)

***

### unwind()

```ts
unwind(expression, alias): this;
```

Defined in: [src/query/builder.ts:345](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L345)

Add UNWIND clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `expression` | `string` | Expression to unwind |
| `alias` | `string` | Alias for unwound items |

#### Returns

`this`

This query builder

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`unwind`](../interfaces/IQueryBuilder.md#unwind)

***

### withParam()

```ts
withParam(name, value): this;
```

Defined in: [src/query/builder.ts:357](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L357)

Add a parameter to the query

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Parameter name |
| `value` | `any` | Parameter value |

#### Returns

`this`

This query builder

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`withParam`](../interfaces/IQueryBuilder.md#withparam)

***

### setParam()

```ts
setParam(key, value): Promise<QueryBuilder<T>>;
```

Defined in: [src/query/builder.ts:373](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L373)

Set a parameter in the age_params temporary table

This method inserts a parameter into the age_params temporary table
using an INSERT ON CONFLICT UPDATE statement. The parameter can then
be referenced in a Cypher query using the get_age_param() function.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | Parameter key |
| `value` | `any` | Parameter value (will be converted to JSON) |

#### Returns

`Promise`\<`QueryBuilder`\<`T`\>\>

This query builder

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`setParam`](../interfaces/IQueryBuilder.md#setparam)

***

### withParamFunction()

```ts
withParamFunction(functionName, alias): this;
```

Defined in: [src/query/builder.ts:398](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L398)

Add a WITH clause that calls a function to get parameters

This is specifically for Apache AGE compatibility, as it requires
parameters to be passed via a function call in a WITH clause.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `functionName` | `string` | Fully qualified function name (e.g., 'schema.get_params') |
| `alias` | `string` | Alias for the function result (e.g., 'params') |

#### Returns

`this`

This query builder

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`withParamFunction`](../interfaces/IQueryBuilder.md#withparamfunction)

***

### withAgeParam()

```ts
withAgeParam(key, alias): this;
```

Defined in: [src/query/builder.ts:413](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L413)

Add a WITH clause that calls the get_age_param function

This method adds a WITH clause that calls the get_age_param function
to retrieve a parameter from the age_params temporary table.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | Parameter key to retrieve |
| `alias` | `string` | Alias for the parameter in the query |

#### Returns

`this`

This query builder

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`withAgeParam`](../interfaces/IQueryBuilder.md#withageparam)

***

### withAllAgeParams()

```ts
withAllAgeParams(alias): this;
```

Defined in: [src/query/builder.ts:428](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L428)

Add a WITH clause that calls the get_all_age_params function

This method adds a WITH clause that calls the get_all_age_params function
to retrieve all parameters from the age_params temporary table.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `alias` | `string` | `'params'` | Alias for the parameters object in the query |

#### Returns

`this`

This query builder

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`withAllAgeParams`](../interfaces/IQueryBuilder.md#withallageparams)

***

### execute()

```ts
execute<R>(options): QueryBuilderResult<R>;
```

Defined in: [src/query/builder.ts:441](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L441)

Execute the query

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `R` | `any` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`QueryExecutionOptions`](../interfaces/QueryExecutionOptions.md) | Query execution options |

#### Returns

[`QueryBuilderResult`](../type-aliases/QueryBuilderResult.md)\<`R`\>

Query result

#### Throws

Error if query validation fails

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`execute`](../interfaces/IQueryBuilder.md#execute)

***

### reset()

```ts
reset(): this;
```

Defined in: [src/query/builder.ts:576](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L576)

Reset the query builder state

#### Returns

`this`

This query builder

***

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/builder.ts:587](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L587)

Get the Cypher query string

#### Returns

`string`

Cypher query string

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`toCypher`](../interfaces/IQueryBuilder.md#tocypher)

***

### getParameters()

```ts
getParameters(): Record<string, any>;
```

Defined in: [src/query/builder.ts:599](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L599)

Get the query parameters

#### Returns

`Record`\<`string`, `any`\>

Query parameters

#### Implementation of

[`IQueryBuilder`](../interfaces/IQueryBuilder.md).[`getParameters`](../interfaces/IQueryBuilder.md#getparameters)

***

### validateQuery()

```ts
validateQuery(): string[];
```

Defined in: [src/query/builder.ts:616](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/builder.ts#L616)

Validate the query against the schema

#### Returns

`string`[]

Validation errors, if any
