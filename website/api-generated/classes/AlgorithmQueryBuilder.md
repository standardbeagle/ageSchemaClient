[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / AlgorithmQueryBuilder

# Class: AlgorithmQueryBuilder\<T\>

Defined in: [src/query/algorithms.ts:330](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L330)

Graph algorithm query builder

Specialized query builder for graph algorithms

## Extends

- [`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](../interfaces/SchemaDefinition.md) |

## Constructors

### Constructor

```ts
new AlgorithmQueryBuilder<T>(
   schema, 
   queryExecutor, 
graphName): AlgorithmQueryBuilder<T>;
```

Defined in: [src/query/algorithms.ts:338](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L338)

Create a new algorithm query builder

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `schema` | `T` | `undefined` | Schema definition |
| `queryExecutor` | [`QueryExecutor`](QueryExecutor.md) | `undefined` | Query executor |
| `graphName` | `string` | `'default'` | Graph name |

#### Returns

`AlgorithmQueryBuilder`\<`T`\>

#### Overrides

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`constructor`](AnalyticsQueryBuilder.md#constructor)

## Methods

### match()

Implementation of the match method for algorithms

#### Call Signature

```ts
match<L>(label, alias): AlgorithmMatchClause<T, L>;
```

Defined in: [src/query/algorithms.ts:349](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L349)

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

[`AlgorithmMatchClause`](AlgorithmMatchClause.md)\<`T`, `L`\>

##### Overrides

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`match`](AnalyticsQueryBuilder.md#match)

#### Call Signature

```ts
match<E>(
   sourceAlias, 
   edgeLabel, 
targetAlias): IEdgeMatchClause<T>;
```

Defined in: [src/query/algorithms.ts:354](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L354)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`match`](AnalyticsQueryBuilder.md#match)

#### Call Signature

```ts
match<E>(
   sourceAlias, 
   edgeLabel, 
   targetAlias, 
edgeAlias): IEdgeMatchClause<T>;
```

Defined in: [src/query/algorithms.ts:363](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L363)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`match`](AnalyticsQueryBuilder.md#match)

***

### shortestPath()

```ts
shortestPath(
   startAlias, 
   endAlias, 
   resultAlias, 
   options): this;
```

Defined in: [src/query/algorithms.ts:416](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L416)

Find the shortest path between two vertices

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `startAlias` | `string` | `undefined` | Start vertex alias |
| `endAlias` | `string` | `undefined` | End vertex alias |
| `resultAlias` | `string` | `'path'` | Result path alias |
| `options` | [`PathFindingOptions`](../interfaces/PathFindingOptions.md) | `{}` | Path finding options |

#### Returns

`this`

This algorithm query builder

***

### allShortestPaths()

```ts
allShortestPaths(
   startAlias, 
   endAlias, 
   resultAlias, 
   options): this;
```

Defined in: [src/query/algorithms.ts:446](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L446)

Find all shortest paths between two vertices

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `startAlias` | `string` | `undefined` | Start vertex alias |
| `endAlias` | `string` | `undefined` | End vertex alias |
| `resultAlias` | `string` | `'paths'` | Result paths alias |
| `options` | [`PathFindingOptions`](../interfaces/PathFindingOptions.md) | `{}` | Path finding options |

#### Returns

`this`

This algorithm query builder

***

### dijkstra()

```ts
dijkstra(
   startAlias, 
   endAlias, 
   costProperty, 
   resultAlias, 
   options): this;
```

Defined in: [src/query/algorithms.ts:477](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L477)

Find the shortest weighted path between two vertices using Dijkstra's algorithm

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `startAlias` | `string` | `undefined` | Start vertex alias |
| `endAlias` | `string` | `undefined` | End vertex alias |
| `costProperty` | `string` | `undefined` | Relationship property to use as cost |
| `resultAlias` | `string` | `'path'` | Result path alias |
| `options` | [`PathFindingOptions`](../interfaces/PathFindingOptions.md) | `{}` | Path finding options |

#### Returns

`this`

This algorithm query builder

***

### betweennessCentrality()

```ts
betweennessCentrality(
   vertexAlias, 
   resultAlias, 
   options): this;
```

Defined in: [src/query/algorithms.ts:502](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L502)

Calculate betweenness centrality for vertices

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `vertexAlias` | `string` | `undefined` | Vertex alias |
| `resultAlias` | `string` | `'centrality'` | Result alias |
| `options` | [`CentralityOptions`](../interfaces/CentralityOptions.md) | `{}` | Centrality options |

#### Returns

`this`

This algorithm query builder

***

### pageRank()

```ts
pageRank(
   vertexAlias, 
   resultAlias, 
   dampingFactor, 
   iterations): this;
```

Defined in: [src/query/algorithms.ts:522](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L522)

Calculate PageRank for vertices

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `vertexAlias` | `string` | `undefined` | Vertex alias |
| `resultAlias` | `string` | `'pagerank'` | Result alias |
| `dampingFactor` | `number` | `0.85` | Damping factor (default: 0.85) |
| `iterations` | `number` | `20` | Number of iterations (default: 20) |

#### Returns

`this`

This algorithm query builder

***

### louvain()

```ts
louvain(
   vertexAlias, 
   resultAlias, 
   options): this;
```

Defined in: [src/query/algorithms.ts:542](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L542)

Detect communities using the Louvain method

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `vertexAlias` | `string` | `undefined` | Vertex alias |
| `resultAlias` | `string` | `'community'` | Result alias |
| `options` | [`CommunityDetectionOptions`](../interfaces/CommunityDetectionOptions.md) | `{}` | Community detection options |

#### Returns

`this`

This algorithm query builder

***

### extractNodes()

```ts
extractNodes(pathAlias, resultAlias): this;
```

Defined in: [src/query/algorithms.ts:560](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L560)

Extract nodes from a path

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `pathAlias` | `string` | `'path'` | Path alias |
| `resultAlias` | `string` | `'nodes'` | Result alias |

#### Returns

`this`

This algorithm query builder

***

### extractRelationships()

```ts
extractRelationships(pathAlias, resultAlias): this;
```

Defined in: [src/query/algorithms.ts:575](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L575)

Extract relationships from a path

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `pathAlias` | `string` | `'path'` | Path alias |
| `resultAlias` | `string` | `'relationships'` | Result alias |

#### Returns

`this`

This algorithm query builder

***

### pathLength()

```ts
pathLength(pathAlias, resultAlias): this;
```

Defined in: [src/query/algorithms.ts:590](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L590)

Calculate the length of a path

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `pathAlias` | `string` | `'path'` | Path alias |
| `resultAlias` | `string` | `'length'` | Result alias |

#### Returns

`this`

This algorithm query builder

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

#### Inherited from

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`groupBy`](AnalyticsQueryBuilder.md#groupby)

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

#### Inherited from

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`windowFunction`](AnalyticsQueryBuilder.md#windowfunction)

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

#### Inherited from

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`rowNumber`](AnalyticsQueryBuilder.md#rownumber)

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

#### Inherited from

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`rank`](AnalyticsQueryBuilder.md#rank)

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

#### Inherited from

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`denseRank`](AnalyticsQueryBuilder.md#denserank)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`where`](AnalyticsQueryBuilder.md#where)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`return`](AnalyticsQueryBuilder.md#return)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`orderBy`](AnalyticsQueryBuilder.md#orderby)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`limit`](AnalyticsQueryBuilder.md#limit)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`skip`](AnalyticsQueryBuilder.md#skip)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`with`](AnalyticsQueryBuilder.md#with)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`unwind`](AnalyticsQueryBuilder.md#unwind)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`withParam`](AnalyticsQueryBuilder.md#withparam)

***

### setParam()

```ts
setParam(key, value): Promise<AlgorithmQueryBuilder<T>>;
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

`Promise`\<`AlgorithmQueryBuilder`\<`T`\>\>

This query builder

#### Inherited from

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`setParam`](AnalyticsQueryBuilder.md#setparam)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`withParamFunction`](AnalyticsQueryBuilder.md#withparamfunction)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`withAgeParam`](AnalyticsQueryBuilder.md#withageparam)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`withAllAgeParams`](AnalyticsQueryBuilder.md#withallageparams)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`execute`](AnalyticsQueryBuilder.md#execute)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`reset`](AnalyticsQueryBuilder.md#reset)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`toCypher`](AnalyticsQueryBuilder.md#tocypher)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`getParameters`](AnalyticsQueryBuilder.md#getparameters)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md).[`validateQuery`](AnalyticsQueryBuilder.md#validatequery)
