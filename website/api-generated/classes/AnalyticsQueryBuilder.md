[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / AnalyticsQueryBuilder

# Class: AnalyticsQueryBuilder\<T\>

Defined in: [src/query/analytics.ts:291](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L291)

Analytics query builder class

Specialized query builder for aggregation and analytics operations on graph data

## Extends

- [`QueryBuilder`](QueryBuilder.md)\<`T`\>

## Extended by

- [`AlgorithmQueryBuilder`](AlgorithmQueryBuilder.md)

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](../interfaces/SchemaDefinition.md) |

## Constructors

### Constructor

```ts
new AnalyticsQueryBuilder<T>(
   schema, 
   queryExecutor, 
graphName): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:299](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L299)

Create a new analytics query builder

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `schema` | `T` | `undefined` | Schema definition |
| `queryExecutor` | [`QueryExecutor`](QueryExecutor.md) | `undefined` | Query executor |
| `graphName` | `string` | `'default'` | Graph name |

#### Returns

`AnalyticsQueryBuilder`\<`T`\>

#### Overrides

[`QueryBuilder`](QueryBuilder.md).[`constructor`](QueryBuilder.md#constructor)

## Methods

### match()

Implementation of the match method for analytics

#### Call Signature

```ts
match<L>(label, alias): IMatchClause<T, L>;
```

Defined in: [src/query/analytics.ts:310](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L310)

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

##### Overrides

[`QueryBuilder`](QueryBuilder.md).[`match`](QueryBuilder.md#match)

#### Call Signature

```ts
match<E>(
   sourceAlias, 
   edgeLabel, 
targetAlias): IEdgeMatchClause<T>;
```

Defined in: [src/query/analytics.ts:315](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L315)

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

##### Overrides

[`QueryBuilder`](QueryBuilder.md).[`match`](QueryBuilder.md#match)

#### Call Signature

```ts
match<E>(
   sourceAlias, 
   edgeLabel, 
   targetAlias, 
edgeAlias): IEdgeMatchClause<T>;
```

Defined in: [src/query/analytics.ts:324](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L324)

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

##### Overrides

[`QueryBuilder`](QueryBuilder.md).[`match`](QueryBuilder.md#match)

***

### groupBy()

```ts
groupBy(...fields): this;
```

Defined in: [src/query/analytics.ts:375](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L375)

Group results by specified fields

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`fields` | `string`[] | Fields to group by |

#### Returns

`this`

This analytics query builder

#### Throws

Error if no RETURN clause is specified before groupBy

***

### windowFunction()

```ts
windowFunction(
   functionType, 
   resultAlias, 
   options): this;
```

Defined in: [src/query/analytics.ts:396](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L396)

Add a window function to the query

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `functionType` | `string` | Window function type |
| `resultAlias` | `string` | Alias for the window function result |
| `options` | [`WindowFunctionOptions`](../interfaces/WindowFunctionOptions.md) | Window function options |

#### Returns

`this`

This analytics query builder

***

### rowNumber()

```ts
rowNumber(resultAlias, options): this;
```

Defined in: [src/query/analytics.ts:462](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L462)

Add ROW_NUMBER window function

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resultAlias` | `string` | Alias for the result |
| `options` | [`WindowFunctionOptions`](../interfaces/WindowFunctionOptions.md) | Window function options |

#### Returns

`this`

This analytics query builder

***

### rank()

```ts
rank(resultAlias, options): this;
```

Defined in: [src/query/analytics.ts:473](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L473)

Add RANK window function

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resultAlias` | `string` | Alias for the result |
| `options` | [`WindowFunctionOptions`](../interfaces/WindowFunctionOptions.md) | Window function options |

#### Returns

`this`

This analytics query builder

***

### denseRank()

```ts
denseRank(resultAlias, options): this;
```

Defined in: [src/query/analytics.ts:484](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L484)

Add DENSE_RANK window function

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resultAlias` | `string` | Alias for the result |
| `options` | [`WindowFunctionOptions`](../interfaces/WindowFunctionOptions.md) | Window function options |

#### Returns

`this`

This analytics query builder

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`where`](QueryBuilder.md#where)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`return`](QueryBuilder.md#return)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`orderBy`](QueryBuilder.md#orderby)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`limit`](QueryBuilder.md#limit)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`skip`](QueryBuilder.md#skip)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`with`](QueryBuilder.md#with)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`unwind`](QueryBuilder.md#unwind)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`withParam`](QueryBuilder.md#withparam)

***

### setParam()

```ts
setParam(key, value): Promise<AnalyticsQueryBuilder<T>>;
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

`Promise`\<`AnalyticsQueryBuilder`\<`T`\>\>

This query builder

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`setParam`](QueryBuilder.md#setparam)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`withParamFunction`](QueryBuilder.md#withparamfunction)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`withAgeParam`](QueryBuilder.md#withageparam)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`withAllAgeParams`](QueryBuilder.md#withallageparams)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`execute`](QueryBuilder.md#execute)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`reset`](QueryBuilder.md#reset)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`toCypher`](QueryBuilder.md#tocypher)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`getParameters`](QueryBuilder.md#getparameters)

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

#### Inherited from

[`QueryBuilder`](QueryBuilder.md).[`validateQuery`](QueryBuilder.md#validatequery)
