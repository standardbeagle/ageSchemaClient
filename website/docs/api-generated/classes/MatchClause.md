[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / MatchClause

# Class: MatchClause\<T, L\>

Defined in: [src/query/clauses.ts:25](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L25)

Match clause implementation

## Extended by

- [`AnalyticsMatchClause`](/ageSchemaClient/api-generated/classes/AnalyticsMatchClause.md)

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) |
| `L` *extends* keyof `T`\[`"vertices"`\] |

## Implements

- [`IMatchClause`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md)\<`T`, `L`\>

## Constructors

### Constructor

```ts
new MatchClause<T, L>(
   queryBuilder, 
   matchPart, 
vertexPattern): MatchClause<T, L>;
```

Defined in: [src/query/clauses.ts:36](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L36)

Create a new match clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `queryBuilder` | [`IQueryBuilder`](/ageSchemaClient/api-generated/interfaces/IQueryBuilder.md)\<`T`\> | Query builder |
| `matchPart` | [`MatchPart`](/ageSchemaClient/api-generated/classes/MatchPart.md) | Match part |
| `vertexPattern` | [`VertexPattern`](/ageSchemaClient/api-generated/interfaces/VertexPattern.md) | Vertex pattern |

#### Returns

`MatchClause`\<`T`, `L`\>

## Methods

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

#### Implementation of

[`IMatchClause`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md).[`constraint`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md#constraint)

***

### where()

```ts
where(condition, params?): this;
```

Defined in: [src/query/clauses.ts:83](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/clauses.ts#L83)

Add WHERE clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | `string` | Condition expression |
| `params?` | `Record`\<`string`, `any`\> | Parameters |

#### Returns

`this`

This match clause

#### Implementation of

[`IMatchClause`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md).[`where`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md#where)

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

#### Implementation of

[`IMatchClause`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md).[`outgoing`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md#outgoing)

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

#### Implementation of

[`IMatchClause`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md).[`incoming`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md#incoming)

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

#### Implementation of

[`IMatchClause`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md).[`related`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md#related)

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

#### Implementation of

[`IMatchClause`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md).[`done`](/ageSchemaClient/api-generated/interfaces/IMatchClause.md#done)
