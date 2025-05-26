[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / IQueryBuilder

# Interface: IQueryBuilder\<T\>

Defined in: [src/query/types.ts:206](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L206)

Query builder interface

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](SchemaDefinition.md) |

## Methods

### match()

#### Call Signature

```ts
match<L>(label, alias): IMatchClause<T, L>;
```

Defined in: [src/query/types.ts:210](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L210)

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

[`IMatchClause`](IMatchClause.md)\<`T`, `L`\>

#### Call Signature

```ts
match<E>(
   sourceAlias, 
   edgeLabel, 
targetAlias): IEdgeMatchClause<T>;
```

Defined in: [src/query/types.ts:220](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L220)

Add MATCH clause for an edge between two previously matched vertices

##### Type Parameters

| Type Parameter |
| ------ |
| `E` *extends* `string` \| `number` \| `symbol` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourceAlias` | `string` | Source vertex alias |
| `edgeLabel` | `E` | Edge label |
| `targetAlias` | `string` | Target vertex alias |

##### Returns

[`IEdgeMatchClause`](IEdgeMatchClause.md)\<`T`\>

Edge match clause

#### Call Signature

```ts
match<E>(
   sourceAlias, 
   edgeLabel, 
   targetAlias, 
edgeAlias): IEdgeMatchClause<T>;
```

Defined in: [src/query/types.ts:235](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L235)

Add MATCH clause for an edge between two previously matched vertices with an edge alias

##### Type Parameters

| Type Parameter |
| ------ |
| `E` *extends* `string` \| `number` \| `symbol` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourceAlias` | `string` | Source vertex alias |
| `edgeLabel` | `E` | Edge label |
| `targetAlias` | `string` | Target vertex alias |
| `edgeAlias` | `string` | Edge alias |

##### Returns

[`IEdgeMatchClause`](IEdgeMatchClause.md)\<`T`\>

Edge match clause

***

### where()

```ts
where(condition, params?): this;
```

Defined in: [src/query/types.ts:245](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L245)

Add WHERE clause

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `condition` | `string` |
| `params?` | `Record`\<`string`, `any`\> |

#### Returns

`this`

***

### return()

```ts
return(...expressions): this;
```

Defined in: [src/query/types.ts:250](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L250)

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

Defined in: [src/query/types.ts:255](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L255)

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

Defined in: [src/query/types.ts:260](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L260)

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

Defined in: [src/query/types.ts:265](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L265)

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

Defined in: [src/query/types.ts:270](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L270)

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

Defined in: [src/query/types.ts:275](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L275)

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

Defined in: [src/query/types.ts:280](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L280)

Add a parameter to the query

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `value` | `any` |

#### Returns

`this`

***

### setParam()

```ts
setParam(key, value): Promise<IQueryBuilder<T>>;
```

Defined in: [src/query/types.ts:285](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L285)

Set a parameter in the age_params temporary table

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `value` | `any` |

#### Returns

`Promise`\<`IQueryBuilder`\<`T`\>\>

***

### withParamFunction()

```ts
withParamFunction(functionName, alias): this;
```

Defined in: [src/query/types.ts:290](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L290)

Add a WITH clause that calls a function to get parameters

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `functionName` | `string` |
| `alias` | `string` |

#### Returns

`this`

***

### withAgeParam()

```ts
withAgeParam(key, alias): this;
```

Defined in: [src/query/types.ts:295](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L295)

Add a WITH clause that calls the get_age_param function

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `alias` | `string` |

#### Returns

`this`

***

### withAllAgeParams()

```ts
withAllAgeParams(alias?): this;
```

Defined in: [src/query/types.ts:300](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L300)

Add a WITH clause that calls the get_all_age_params function

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `alias?` | `string` |

#### Returns

`this`

***

### execute()

```ts
execute<R>(options?): QueryBuilderResult<R>;
```

Defined in: [src/query/types.ts:305](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L305)

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

Defined in: [src/query/types.ts:310](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L310)

Get the Cypher query string

#### Returns

`string`

***

### getParameters()

```ts
getParameters(): Record<string, any>;
```

Defined in: [src/query/types.ts:315](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L315)

Get the query parameters

#### Returns

`Record`\<`string`, `any`\>
