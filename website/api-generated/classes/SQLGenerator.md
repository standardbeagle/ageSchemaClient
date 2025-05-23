[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / SQLGenerator

# Class: SQLGenerator

Defined in: [src/sql/generator.ts:54](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L54)

SQL Generator class for generating SQL statements based on schema definitions

## Constructors

### Constructor

```ts
new SQLGenerator(schema): SQLGenerator;
```

Defined in: [src/sql/generator.ts:60](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L60)

Create a new SQLGenerator instance

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | [`SchemaDefinition`](../interfaces/SchemaDefinition.md) | Schema definition |

#### Returns

`SQLGenerator`

## Methods

### generateCreateVertexTableSQL()

```ts
generateCreateVertexTableSQL(label, options): SQLResult;
```

Defined in: [src/sql/generator.ts:74](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L74)

Generate CREATE TABLE statement for a vertex label

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Vertex label |
| `options` | [`SQLVertexTableOptions`](../interfaces/SQLVertexTableOptions.md) | `DEFAULT_VERTEX_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result

***

### generateCreateVertexSQL()

```ts
generateCreateVertexSQL(label, data): SQLResult;
```

Defined in: [src/sql/generator.ts:120](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L120)

Generate SQL to create a vertex

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `string` | Vertex label |
| `data` | `Record`\<`string`, `unknown`\> | Vertex data |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL query and parameters

***

### generateInsertVertexSQL()

```ts
generateInsertVertexSQL(
   label, 
   data, 
   options): SQLResult;
```

Defined in: [src/sql/generator.ts:135](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L135)

Generate INSERT statement for a vertex

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Vertex label |
| `data` | `Record`\<`string`, `any`\> | `undefined` | Vertex data |
| `options` | [`SQLVertexTableOptions`](../interfaces/SQLVertexTableOptions.md) | `DEFAULT_VERTEX_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with parameterized query and parameters

***

### generateBatchInsertVertexSQL()

```ts
generateBatchInsertVertexSQL(
   label, 
   dataArray, 
   options): SQLResult;
```

Defined in: [src/sql/generator.ts:181](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L181)

Generate batch INSERT statement for multiple vertices

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Vertex label |
| `dataArray` | `Record`\<`string`, `any`\>[] | `undefined` | Array of vertex data |
| `options` | [`SQLVertexTableOptions`](../interfaces/SQLVertexTableOptions.md) | `DEFAULT_VERTEX_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with parameterized query and parameters

***

### generateUpdateVertexSQL()

```ts
generateUpdateVertexSQL(
   label, 
   id, 
   data, 
   options): SQLResult;
```

Defined in: [src/sql/generator.ts:258](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L258)

Generate UPDATE statement for a vertex

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Vertex label |
| `id` | `string` | `undefined` | Vertex ID |
| `data` | `Record`\<`string`, `any`\> | `undefined` | Vertex data to update |
| `options` | [`SQLVertexTableOptions`](../interfaces/SQLVertexTableOptions.md) | `DEFAULT_VERTEX_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with parameterized query and parameters

***

### generateDeleteVertexSQL()

```ts
generateDeleteVertexSQL(
   label, 
   id, 
   options): SQLResult;
```

Defined in: [src/sql/generator.ts:312](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L312)

Generate DELETE statement for a vertex

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Vertex label |
| `id` | `string` | `undefined` | Vertex ID |
| `options` | [`SQLVertexTableOptions`](../interfaces/SQLVertexTableOptions.md) | `DEFAULT_VERTEX_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with parameterized query and parameters

***

### generateSelectVertexSQL()

```ts
generateSelectVertexSQL(
   label, 
   queryOptions, 
   options): SQLResult;
```

Defined in: [src/sql/generator.ts:345](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L345)

Generate SELECT statement for vertices

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Vertex label |
| `queryOptions` | [`SQLQueryOptions`](../interfaces/SQLQueryOptions.md) | `{}` | Query options |
| `options` | [`SQLVertexTableOptions`](../interfaces/SQLVertexTableOptions.md) | `DEFAULT_VERTEX_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with parameterized query and parameters

***

### generateVertexFilterFunctionSQL()

```ts
generateVertexFilterFunctionSQL(label, options): SQLResult;
```

Defined in: [src/sql/generator.ts:460](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L460)

Generate a filter function for vertices

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Vertex label |
| `options` | [`SQLVertexTableOptions`](../interfaces/SQLVertexTableOptions.md) | `DEFAULT_VERTEX_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with function definition

***

### generateTransactionSQL()

```ts
generateTransactionSQL(type, name?): SQLResult;
```

Defined in: [src/sql/generator.ts:543](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L543)

Generate a transaction control statement

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `type` | [`SQLTransactionType`](../enumerations/SQLTransactionType.md) | Transaction type |
| `name?` | `string` | Optional savepoint name |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result

***

### generateBatchSQL()

```ts
generateBatchSQL(operations): SQLResult;
```

Defined in: [src/sql/generator.ts:587](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L587)

Generate a batch SQL statement with multiple operations in a transaction

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `operations` | [`SQLResult`](../interfaces/SQLResult.md)[] | Array of SQL results to combine |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with combined statements

***

### generateCreateEdgeTableSQL()

```ts
generateCreateEdgeTableSQL(label, options): SQLResult;
```

Defined in: [src/sql/generator.ts:627](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L627)

Generate CREATE TABLE statement for an edge label

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Edge label |
| `options` | [`SQLEdgeTableOptions`](../interfaces/SQLEdgeTableOptions.md) | `DEFAULT_EDGE_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result

***

### generateInsertEdgeSQL()

```ts
generateInsertEdgeSQL(
   label, 
   sourceId, 
   targetId, 
   data, 
   options): SQLResult;
```

Defined in: [src/sql/generator.ts:697](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L697)

Generate INSERT statement for an edge

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Edge label |
| `sourceId` | `string` | `undefined` | Source vertex ID |
| `targetId` | `string` | `undefined` | Target vertex ID |
| `data` | `Record`\<`string`, `any`\> | `{}` | Edge data |
| `options` | [`SQLEdgeTableOptions`](../interfaces/SQLEdgeTableOptions.md) | `DEFAULT_EDGE_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with parameterized query and parameters

***

### generateBatchInsertEdgeSQL()

```ts
generateBatchInsertEdgeSQL(
   label, 
   edges, 
   options): SQLResult;
```

Defined in: [src/sql/generator.ts:753](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L753)

Generate batch INSERT statement for multiple edges

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Edge label |
| `edges` | `object`[] | `undefined` | Array of edge data with source and target IDs |
| `options` | [`SQLEdgeTableOptions`](../interfaces/SQLEdgeTableOptions.md) | `DEFAULT_EDGE_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with parameterized query and parameters

***

### generateUpdateEdgeSQL()

```ts
generateUpdateEdgeSQL(
   label, 
   id, 
   data, 
   options): SQLResult;
```

Defined in: [src/sql/generator.ts:848](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L848)

Generate UPDATE statement for an edge

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Edge label |
| `id` | `string` | `undefined` | Edge ID |
| `data` | `Record`\<`string`, `any`\> | `undefined` | Edge data to update |
| `options` | [`SQLEdgeTableOptions`](../interfaces/SQLEdgeTableOptions.md) | `DEFAULT_EDGE_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with parameterized query and parameters

***

### generateDeleteEdgeSQL()

```ts
generateDeleteEdgeSQL(
   label, 
   id, 
   options): SQLResult;
```

Defined in: [src/sql/generator.ts:902](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L902)

Generate DELETE statement for an edge

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Edge label |
| `id` | `string` | `undefined` | Edge ID |
| `options` | [`SQLEdgeTableOptions`](../interfaces/SQLEdgeTableOptions.md) | `DEFAULT_EDGE_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with parameterized query and parameters

***

### generateDeleteEdgesBetweenVerticesSQL()

```ts
generateDeleteEdgesBetweenVerticesSQL(
   label, 
   sourceId, 
   targetId, 
   options): SQLResult;
```

Defined in: [src/sql/generator.ts:936](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L936)

Generate DELETE statement for edges between vertices

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Edge label |
| `sourceId` | `string` | `undefined` | Source vertex ID |
| `targetId` | `string` | `undefined` | Target vertex ID |
| `options` | [`SQLEdgeTableOptions`](../interfaces/SQLEdgeTableOptions.md) | `DEFAULT_EDGE_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with parameterized query and parameters

***

### generateSelectEdgeSQL()

```ts
generateSelectEdgeSQL(
   label, 
   queryOptions, 
   options): SQLResult;
```

Defined in: [src/sql/generator.ts:971](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L971)

Generate SELECT statement for edges

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Edge label |
| `queryOptions` | [`SQLQueryOptions`](../interfaces/SQLQueryOptions.md) | `{}` | Query options |
| `options` | [`SQLEdgeTableOptions`](../interfaces/SQLEdgeTableOptions.md) | `DEFAULT_EDGE_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with parameterized query and parameters

***

### generateEdgeFilterFunctionSQL()

```ts
generateEdgeFilterFunctionSQL(label, options): SQLResult;
```

Defined in: [src/sql/generator.ts:1127](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L1127)

Generate a filter function for edges

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Edge label |
| `options` | [`SQLEdgeTableOptions`](../interfaces/SQLEdgeTableOptions.md) | `DEFAULT_EDGE_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with function definition
