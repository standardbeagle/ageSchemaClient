[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / AnalyticsMatchClause

# Class: AnalyticsMatchClause\<T, L\>

Defined in: [src/query/analytics.ts:27](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L27)

Analytics match clause class

Extends the standard match clause with analytics capabilities

## Extends

- [`MatchClause`](MatchClause.md)\<`T`, `L`\>

## Extended by

- [`AlgorithmMatchClause`](AlgorithmMatchClause.md)

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](../interfaces/SchemaDefinition.md) |
| `L` *extends* keyof `T`\[`"vertices"`\] |

## Constructors

### Constructor

```ts
new AnalyticsMatchClause<T, L>(
   queryBuilder, 
   matchPart, 
vertexPattern): AnalyticsMatchClause<T, L>;
```

Defined in: [src/query/analytics.ts:38](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L38)

Create a new analytics match clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `queryBuilder` | [`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\> | Query builder |
| `matchPart` | [`MatchPart`](MatchPart.md) | Match part |
| `vertexPattern` | [`VertexPattern`](../interfaces/VertexPattern.md) | Vertex pattern |

#### Returns

`AnalyticsMatchClause`\<`T`, `L`\>

#### Overrides

[`MatchClause`](MatchClause.md).[`constructor`](MatchClause.md#constructor)

## Methods

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

The analytics query builder

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

The analytics query builder

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

The analytics query builder

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

The analytics query builder

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

The analytics query builder

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

The analytics query builder

***

### match()

```ts
match<K>(label, alias): AnalyticsMatchClause<T, K>;
```

Defined in: [src/query/analytics.ts:135](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/analytics.ts#L135)

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

`AnalyticsMatchClause`\<`T`, `K`\>

A new analytics match clause

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

#### Overrides

[`MatchClause`](MatchClause.md).[`where`](MatchClause.md#where)

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

This analytics query builder

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

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

This analytics query builder

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
| `options` | [`WindowFunctionOptions`](../interfaces/WindowFunctionOptions.md) | Window function options |

#### Returns

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

This analytics query builder

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
| `options` | [`WindowFunctionOptions`](../interfaces/WindowFunctionOptions.md) | Window function options |

#### Returns

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

This analytics query builder

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
| `options` | [`WindowFunctionOptions`](../interfaces/WindowFunctionOptions.md) | Window function options |

#### Returns

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

This analytics query builder

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
| `options` | [`WindowFunctionOptions`](../interfaces/WindowFunctionOptions.md) | Window function options |

#### Returns

[`AnalyticsQueryBuilder`](AnalyticsQueryBuilder.md)\<`T`\>

This analytics query builder

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

[`MatchClause`](MatchClause.md).[`constraint`](MatchClause.md#constraint)

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

[`MatchClause`](MatchClause.md).[`outgoing`](MatchClause.md#outgoing)

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

[`MatchClause`](MatchClause.md).[`incoming`](MatchClause.md#incoming)

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

[`MatchClause`](MatchClause.md).[`related`](MatchClause.md#related)

***

### done()

```ts
done(): IQueryBuilder<T>;
```

Defined in: [src/query/clauses.ts:244](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L244)

Return to the main query builder

#### Returns

[`IQueryBuilder`](../interfaces/IQueryBuilder.md)\<`T`\>

Query builder

#### Inherited from

[`MatchClause`](MatchClause.md).[`done`](MatchClause.md#done)
