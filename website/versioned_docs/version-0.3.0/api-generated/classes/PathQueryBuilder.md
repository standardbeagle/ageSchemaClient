[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / PathQueryBuilder

# Class: PathQueryBuilder\<T\>

Defined in: [src/query/path.ts:72](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L72)

Path query builder class

Specialized query builder for path finding and traversal operations

## Extends

- [`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md)\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) |

## Constructors

### Constructor

```ts
new PathQueryBuilder<T>(
   schema, 
   queryExecutor, 
graphName): PathQueryBuilder<T>;
```

Defined in: [src/query/path.ts:80](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L80)

Create a new path query builder

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `schema` | `T` | `undefined` | Schema definition |
| `queryExecutor` | [`QueryExecutor`](/ageSchemaClient/api-generated/classes/QueryExecutor.md) | `undefined` | Query executor |
| `graphName` | `string` | `'default'` | Graph name |

#### Returns

`PathQueryBuilder`\<`T`\>

#### Overrides

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`constructor`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#constructor)

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

[`IMatchClause`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md)\<`T`, `L`\>

##### Inherited from

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`match`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#match)

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

[`IEdgeMatchClause`](/ageSchemaClient/api-generated/interfaces/IEdgeMatchClause.md)\<`T`\>

##### Inherited from

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`match`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#match)

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

[`IEdgeMatchClause`](/ageSchemaClient/api-generated/interfaces/IEdgeMatchClause.md)\<`T`\>

##### Inherited from

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`match`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#match)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`where`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#where)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`return`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#return)

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
| `direction` | [`OrderDirection`](/ageSchemaClient/api-generated/enumerations/OrderDirection.md) | `OrderDirection.ASC` | Order direction |

#### Returns

`this`

This query builder

#### Inherited from

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`orderBy`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#orderby)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`limit`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#limit)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`skip`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#skip)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`with`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#with)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`unwind`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#unwind)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`withParam`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#withparam)

***

### setParam()

```ts
setParam(key, value): Promise<PathQueryBuilder<T>>;
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

`Promise`\<`PathQueryBuilder`\<`T`\>\>

This query builder

#### Inherited from

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`setParam`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#setparam)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`withParamFunction`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#withparamfunction)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`withAgeParam`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#withageparam)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`withAllAgeParams`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#withallageparams)

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
| `options` | [`QueryExecutionOptions`](/ageSchemaClient/api-generated/interfaces/QueryExecutionOptions.md) | Query execution options |

#### Returns

[`QueryBuilderResult`](/ageSchemaClient/api-generated/type-aliases/QueryBuilderResult.md)\<`R`\>

Query result

#### Throws

Error if query validation fails

#### Inherited from

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`execute`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#execute)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`reset`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#reset)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`toCypher`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#tocypher)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`getParameters`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#getparameters)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md).[`validateQuery`](/ageSchemaClient/api-generated/classes/QueryBuilder.md#validatequery)

***

### shortestPath()

```ts
shortestPath(
   startAlias, 
   endAlias, 
   relationshipTypes?, 
   maxDepth?): this;
```

Defined in: [src/query/path.ts:97](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L97)

Find the shortest path between two vertices

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `startAlias` | `string` | Start vertex alias |
| `endAlias` | `string` | End vertex alias |
| `relationshipTypes?` | `string`[] | Relationship types to traverse |
| `maxDepth?` | `number` | Maximum path depth |

#### Returns

`this`

This path query builder

***

### allPaths()

```ts
allPaths(
   startAlias, 
   endAlias, 
   relationshipTypes?, 
   maxDepth?): this;
```

Defined in: [src/query/path.ts:120](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L120)

Find all paths between two vertices

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `startAlias` | `string` | Start vertex alias |
| `endAlias` | `string` | End vertex alias |
| `relationshipTypes?` | `string`[] | Relationship types to traverse |
| `maxDepth?` | `number` | Maximum path depth |

#### Returns

`this`

This path query builder

***

### variableLengthPath()

```ts
variableLengthPath(
   startAlias, 
   relationshipAlias, 
   endAlias, 
   relationshipTypes?, 
   minDepth?, 
   maxDepth?): this;
```

Defined in: [src/query/path.ts:145](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L145)

Create a variable-length path query

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `startAlias` | `string` | `undefined` | Start vertex alias |
| `relationshipAlias` | `string` | `undefined` | Relationship alias |
| `endAlias` | `string` | `undefined` | End vertex alias |
| `relationshipTypes?` | `string`[] | `undefined` | Relationship types to traverse |
| `minDepth?` | `number` | `1` | Minimum path depth |
| `maxDepth?` | `number` | `undefined` | Maximum path depth |

#### Returns

`this`

This path query builder

***

### breadthFirstSearch()

```ts
breadthFirstSearch(
   startAlias, 
   relationshipAlias, 
   endAlias, 
   relationshipTypes?, 
   maxDepth?): this;
```

Defined in: [src/query/path.ts:175](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L175)

Perform a breadth-first search

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `startAlias` | `string` | `undefined` | Start vertex alias |
| `relationshipAlias` | `string` | `undefined` | Relationship alias |
| `endAlias` | `string` | `undefined` | End vertex alias |
| `relationshipTypes?` | `string`[] | `undefined` | Relationship types to traverse |
| `maxDepth?` | `number` | `5` | Maximum depth |

#### Returns

`this`

This path query builder

***

### extractNodes()

```ts
extractNodes(pathAlias): this;
```

Defined in: [src/query/path.ts:207](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L207)

Extract nodes from a path

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `pathAlias` | `string` | `'p'` | Path alias |

#### Returns

`this`

This path query builder

***

### extractRelationships()

```ts
extractRelationships(pathAlias): this;
```

Defined in: [src/query/path.ts:218](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L218)

Extract relationships from a path

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `pathAlias` | `string` | `'p'` | Path alias |

#### Returns

`this`

This path query builder

***

### extractPath()

```ts
extractPath(pathAlias): this;
```

Defined in: [src/query/path.ts:229](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/path.ts#L229)

Extract both nodes and relationships from a path

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `pathAlias` | `string` | `'p'` | Path alias |

#### Returns

`this`

This path query builder
