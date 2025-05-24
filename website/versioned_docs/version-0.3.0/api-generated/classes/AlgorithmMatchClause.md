[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / AlgorithmMatchClause

# Class: AlgorithmMatchClause\<T, L\>

Defined in: [src/query/algorithms.ts:126](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L126)

Algorithm match clause class

Extends the analytics match clause with graph algorithm capabilities

## Extends

- [`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md)\<`T`, `L`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) |
| `L` *extends* keyof `T`\[`"vertices"`\] |

## Constructors

### Constructor

```ts
new AlgorithmMatchClause<T, L>(
   queryBuilder, 
   matchPart, 
vertexPattern): AlgorithmMatchClause<T, L>;
```

Defined in: [src/query/algorithms.ts:137](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L137)

Create a new algorithm match clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `queryBuilder` | [`AlgorithmQueryBuilder`](/ageSchemaClient/api-generated/classes/AlgorithmQueryBuilder.md)\<`T`\> | Query builder |
| `matchPart` | [`MatchPart`](/ageSchemaClient/api-generated/classes/MatchPart.md) | Match part |
| `vertexPattern` | [`VertexPattern`](/ageSchemaClient/api-generated/interfaces/VertexPattern.md) | Vertex pattern |

#### Returns

`AlgorithmMatchClause`\<`T`, `L`\>

#### Overrides

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`constructor`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#constructor)

## Methods

### shortestPath()

```ts
shortestPath(
   startAlias, 
   endAlias, 
   resultAlias, 
options): AlgorithmQueryBuilder<T>;
```

Defined in: [src/query/algorithms.ts:155](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L155)

Find the shortest path between two vertices

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `startAlias` | `string` | `undefined` | Start vertex alias |
| `endAlias` | `string` | `undefined` | End vertex alias |
| `resultAlias` | `string` | `'path'` | Result path alias |
| `options` | [`PathFindingOptions`](/ageSchemaClient/api-generated/interfaces/PathFindingOptions.md) | `{}` | Path finding options |

#### Returns

[`AlgorithmQueryBuilder`](/ageSchemaClient/api-generated/classes/AlgorithmQueryBuilder.md)\<`T`\>

This algorithm query builder

***

### allShortestPaths()

```ts
allShortestPaths(
   startAlias, 
   endAlias, 
   resultAlias, 
options): AlgorithmQueryBuilder<T>;
```

Defined in: [src/query/algorithms.ts:175](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L175)

Find all shortest paths between two vertices

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `startAlias` | `string` | `undefined` | Start vertex alias |
| `endAlias` | `string` | `undefined` | End vertex alias |
| `resultAlias` | `string` | `'paths'` | Result paths alias |
| `options` | [`PathFindingOptions`](/ageSchemaClient/api-generated/interfaces/PathFindingOptions.md) | `{}` | Path finding options |

#### Returns

[`AlgorithmQueryBuilder`](/ageSchemaClient/api-generated/classes/AlgorithmQueryBuilder.md)\<`T`\>

This algorithm query builder

***

### dijkstra()

```ts
dijkstra(
   startAlias, 
   endAlias, 
   costProperty, 
   resultAlias, 
options): AlgorithmQueryBuilder<T>;
```

Defined in: [src/query/algorithms.ts:196](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L196)

Find the shortest weighted path between two vertices using Dijkstra's algorithm

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `startAlias` | `string` | `undefined` | Start vertex alias |
| `endAlias` | `string` | `undefined` | End vertex alias |
| `costProperty` | `string` | `undefined` | Relationship property to use as cost |
| `resultAlias` | `string` | `'path'` | Result path alias |
| `options` | [`PathFindingOptions`](/ageSchemaClient/api-generated/interfaces/PathFindingOptions.md) | `{}` | Path finding options |

#### Returns

[`AlgorithmQueryBuilder`](/ageSchemaClient/api-generated/classes/AlgorithmQueryBuilder.md)\<`T`\>

This algorithm query builder

***

### betweennessCentrality()

```ts
betweennessCentrality(
   vertexAlias, 
   resultAlias, 
options): AlgorithmQueryBuilder<T>;
```

Defined in: [src/query/algorithms.ts:216](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L216)

Calculate betweenness centrality for vertices

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `vertexAlias` | `string` | `undefined` | Vertex alias |
| `resultAlias` | `string` | `'centrality'` | Result alias |
| `options` | [`CentralityOptions`](/ageSchemaClient/api-generated/interfaces/CentralityOptions.md) | `{}` | Centrality options |

#### Returns

[`AlgorithmQueryBuilder`](/ageSchemaClient/api-generated/classes/AlgorithmQueryBuilder.md)\<`T`\>

This algorithm query builder

***

### pageRank()

```ts
pageRank(
   vertexAlias, 
   resultAlias, 
   dampingFactor, 
iterations): AlgorithmQueryBuilder<T>;
```

Defined in: [src/query/algorithms.ts:235](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L235)

Calculate PageRank for vertices

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `vertexAlias` | `string` | `undefined` | Vertex alias |
| `resultAlias` | `string` | `'pagerank'` | Result alias |
| `dampingFactor` | `number` | `0.85` | Damping factor (default: 0.85) |
| `iterations` | `number` | `20` | Number of iterations (default: 20) |

#### Returns

[`AlgorithmQueryBuilder`](/ageSchemaClient/api-generated/classes/AlgorithmQueryBuilder.md)\<`T`\>

This algorithm query builder

***

### louvain()

```ts
louvain(
   vertexAlias, 
   resultAlias, 
options): AlgorithmQueryBuilder<T>;
```

Defined in: [src/query/algorithms.ts:254](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L254)

Detect communities using the Louvain method

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `vertexAlias` | `string` | `undefined` | Vertex alias |
| `resultAlias` | `string` | `'community'` | Result alias |
| `options` | [`CommunityDetectionOptions`](/ageSchemaClient/api-generated/interfaces/CommunityDetectionOptions.md) | `{}` | Community detection options |

#### Returns

[`AlgorithmQueryBuilder`](/ageSchemaClient/api-generated/classes/AlgorithmQueryBuilder.md)\<`T`\>

This algorithm query builder

***

### extractNodes()

```ts
extractNodes(pathAlias, resultAlias): AlgorithmQueryBuilder<T>;
```

Defined in: [src/query/algorithms.ts:271](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L271)

Extract nodes from a path

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `pathAlias` | `string` | `'path'` | Path alias |
| `resultAlias` | `string` | `'nodes'` | Result alias |

#### Returns

[`AlgorithmQueryBuilder`](/ageSchemaClient/api-generated/classes/AlgorithmQueryBuilder.md)\<`T`\>

This algorithm query builder

***

### extractRelationships()

```ts
extractRelationships(pathAlias, resultAlias): AlgorithmQueryBuilder<T>;
```

Defined in: [src/query/algorithms.ts:287](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L287)

Extract relationships from a path

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `pathAlias` | `string` | `'path'` | Path alias |
| `resultAlias` | `string` | `'relationships'` | Result alias |

#### Returns

[`AlgorithmQueryBuilder`](/ageSchemaClient/api-generated/classes/AlgorithmQueryBuilder.md)\<`T`\>

This algorithm query builder

***

### pathLength()

```ts
pathLength(pathAlias, resultAlias): AlgorithmQueryBuilder<T>;
```

Defined in: [src/query/algorithms.ts:303](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L303)

Calculate the length of a path

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `pathAlias` | `string` | `'path'` | Path alias |
| `resultAlias` | `string` | `'length'` | Result alias |

#### Returns

[`AlgorithmQueryBuilder`](/ageSchemaClient/api-generated/classes/AlgorithmQueryBuilder.md)\<`T`\>

This algorithm query builder

***

### match()

```ts
match<K>(label, alias): AlgorithmMatchClause<T, K>;
```

Defined in: [src/query/algorithms.ts:319](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/algorithms.ts#L319)

Add another match clause

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `K` | Vertex label |
| `alias` | `string` | Vertex alias |

#### Returns

`AlgorithmMatchClause`\<`T`, `K`\>

A new algorithm match clause

#### Overrides

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`match`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#match)

***

### count()

```ts
count(
   alias, 
   resultAlias, 
distinct): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:55](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L55)

Count vertices or edges

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `alias` | `string` | `undefined` | Alias of the vertex or edge to count |
| `resultAlias` | `string` | `'count'` | Alias for the count result (default: 'count') |
| `distinct` | `boolean` | `false` | Whether to count distinct elements (default: false) |

#### Returns

[`AnalyticsQueryBuilder`](/ageSchemaClient/api-generated/classes/AnalyticsQueryBuilder.md)\<`T`\>

The analytics query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`count`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#count)

***

### sum()

```ts
sum(expression, resultAlias): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:69](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L69)

Sum values of a property

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `expression` | `string` | `undefined` | Expression to sum (e.g., 'n.age') |
| `resultAlias` | `string` | `'sum'` | Alias for the sum result (default: 'sum') |

#### Returns

[`AnalyticsQueryBuilder`](/ageSchemaClient/api-generated/classes/AnalyticsQueryBuilder.md)\<`T`\>

The analytics query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`sum`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#sum)

***

### avg()

```ts
avg(expression, resultAlias): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:82](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L82)

Calculate average of a property

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `expression` | `string` | `undefined` | Expression to average (e.g., 'n.age') |
| `resultAlias` | `string` | `'avg'` | Alias for the average result (default: 'avg') |

#### Returns

[`AnalyticsQueryBuilder`](/ageSchemaClient/api-generated/classes/AnalyticsQueryBuilder.md)\<`T`\>

The analytics query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`avg`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#avg)

***

### min()

```ts
min(expression, resultAlias): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:95](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L95)

Find minimum value of a property

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `expression` | `string` | `undefined` | Expression to find minimum (e.g., 'n.age') |
| `resultAlias` | `string` | `'min'` | Alias for the minimum result (default: 'min') |

#### Returns

[`AnalyticsQueryBuilder`](/ageSchemaClient/api-generated/classes/AnalyticsQueryBuilder.md)\<`T`\>

The analytics query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`min`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#min)

***

### max()

```ts
max(expression, resultAlias): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:108](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L108)

Find maximum value of a property

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `expression` | `string` | `undefined` | Expression to find maximum (e.g., 'n.age') |
| `resultAlias` | `string` | `'max'` | Alias for the maximum result (default: 'max') |

#### Returns

[`AnalyticsQueryBuilder`](/ageSchemaClient/api-generated/classes/AnalyticsQueryBuilder.md)\<`T`\>

The analytics query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`max`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#max)

***

### aggregate()

```ts
aggregate(
   functionName, 
   expression, 
resultAlias): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:122](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L122)

Apply a custom aggregation function

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `functionName` | `string` | Aggregation function name |
| `expression` | `string` | Expression to aggregate |
| `resultAlias` | `string` | Alias for the result |

#### Returns

[`AnalyticsQueryBuilder`](/ageSchemaClient/api-generated/classes/AnalyticsQueryBuilder.md)\<`T`\>

The analytics query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`aggregate`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#aggregate)

***

### where()

```ts
where(condition, params?): this;
```

Defined in: [src/query/analytics.ts:147](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L147)

Add WHERE clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | `string` | Condition expression |
| `params?` | `Record`\<`string`, `any`\> | Parameters |

#### Returns

`this`

This analytics match clause

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`where`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#where)

***

### return()

```ts
return(...expressions): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:161](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L161)

Add RETURN clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`expressions` | `string`[] | Return expressions |

#### Returns

[`AnalyticsQueryBuilder`](/ageSchemaClient/api-generated/classes/AnalyticsQueryBuilder.md)\<`T`\>

This analytics query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`return`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#return)

***

### groupBy()

```ts
groupBy(...fields): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:173](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L173)

Add GROUP BY clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`fields` | `string`[] | Fields to group by |

#### Returns

[`AnalyticsQueryBuilder`](/ageSchemaClient/api-generated/classes/AnalyticsQueryBuilder.md)\<`T`\>

This analytics query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`groupBy`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#groupby)

***

### windowFunction()

```ts
windowFunction(
   functionType, 
   resultAlias, 
options): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:187](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L187)

Add a window function to the query

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `functionType` | `string` | Window function type |
| `resultAlias` | `string` | Alias for the window function result |
| `options` | [`WindowFunctionOptions`](/ageSchemaClient/api-generated/interfaces/WindowFunctionOptions.md) | Window function options |

#### Returns

[`AnalyticsQueryBuilder`](/ageSchemaClient/api-generated/classes/AnalyticsQueryBuilder.md)\<`T`\>

This analytics query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`windowFunction`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#windowfunction)

***

### rowNumber()

```ts
rowNumber(resultAlias, options): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:204](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L204)

Add ROW_NUMBER window function

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resultAlias` | `string` | Alias for the result |
| `options` | [`WindowFunctionOptions`](/ageSchemaClient/api-generated/interfaces/WindowFunctionOptions.md) | Window function options |

#### Returns

[`AnalyticsQueryBuilder`](/ageSchemaClient/api-generated/classes/AnalyticsQueryBuilder.md)\<`T`\>

This analytics query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`rowNumber`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#rownumber)

***

### rank()

```ts
rank(resultAlias, options): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:217](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L217)

Add RANK window function

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resultAlias` | `string` | Alias for the result |
| `options` | [`WindowFunctionOptions`](/ageSchemaClient/api-generated/interfaces/WindowFunctionOptions.md) | Window function options |

#### Returns

[`AnalyticsQueryBuilder`](/ageSchemaClient/api-generated/classes/AnalyticsQueryBuilder.md)\<`T`\>

This analytics query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`rank`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#rank)

***

### denseRank()

```ts
denseRank(resultAlias, options): AnalyticsQueryBuilder<T>;
```

Defined in: [src/query/analytics.ts:230](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L230)

Add DENSE_RANK window function

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resultAlias` | `string` | Alias for the result |
| `options` | [`WindowFunctionOptions`](/ageSchemaClient/api-generated/interfaces/WindowFunctionOptions.md) | Window function options |

#### Returns

[`AnalyticsQueryBuilder`](/ageSchemaClient/api-generated/classes/AnalyticsQueryBuilder.md)\<`T`\>

This analytics query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`denseRank`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#denserank)

***

### constraint()

```ts
constraint(properties): this;
```

Defined in: [src/query/clauses.ts:49](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L49)

Add property constraints to the vertex pattern

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | `Record`\<`string`, `any`\> | Object with property-value pairs |

#### Returns

`this`

This match clause

#### Throws

Error if any property value is null, undefined, or NaN

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`constraint`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#constraint)

***

### outgoing()

```ts
outgoing<E>(
   label, 
   alias, 
   targetLabel, 
   targetAlias): this;
```

Defined in: [src/query/clauses.ts:98](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L98)

Add outgoing edge

#### Type Parameters

| Type Parameter |
| ------ |
| `E` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `E` | Edge label |
| `alias` | `string` | Edge alias |
| `targetLabel` | keyof `T`\[`"vertices"`\] | Target vertex label |
| `targetAlias` | `string` | Target vertex alias |

#### Returns

`this`

This match clause

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`outgoing`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#outgoing)

***

### incoming()

```ts
incoming<E>(
   label, 
   alias, 
   sourceLabel, 
   sourceAlias): this;
```

Defined in: [src/query/clauses.ts:148](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L148)

Add incoming edge

#### Type Parameters

| Type Parameter |
| ------ |
| `E` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `E` | Edge label |
| `alias` | `string` | Edge alias |
| `sourceLabel` | keyof `T`\[`"vertices"`\] | Source vertex label |
| `sourceAlias` | `string` | Source vertex alias |

#### Returns

`this`

This match clause

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`incoming`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#incoming)

***

### related()

```ts
related<E>(
   label, 
   alias, 
   otherLabel, 
   otherAlias): this;
```

Defined in: [src/query/clauses.ts:198](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L198)

Add bidirectional edge

#### Type Parameters

| Type Parameter |
| ------ |
| `E` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `E` | Edge label |
| `alias` | `string` | Edge alias |
| `otherLabel` | keyof `T`\[`"vertices"`\] | Other vertex label |
| `otherAlias` | `string` | Other vertex alias |

#### Returns

`this`

This match clause

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`related`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#related)

***

### done()

```ts
done(): IQueryBuilder<T>;
```

Defined in: [src/query/clauses.ts:244](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L244)

Return to the main query builder

#### Returns

[`IQueryBuilder`](/ageSchemaClient/api-generated/interfaces/IQueryBuilder.md)\<`T`\>

Query builder

#### Inherited from

[`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md).[`done`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md#done)
