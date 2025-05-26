[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / SQLGenerator

# Class: SQLGenerator

Defined in: [src/sql/generator.ts:53](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L53)

SQL Generator class for generating SQL statements based on schema definitions

## Constructors

### Constructor

```ts
new SQLGenerator(schema): SQLGenerator;
```

Defined in: [src/sql/generator.ts:59](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L59)

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

Defined in: [src/sql/generator.ts:73](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L73)

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

Defined in: [src/sql/generator.ts:119](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L119)

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

Defined in: [src/sql/generator.ts:134](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L134)

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

Defined in: [src/sql/generator.ts:180](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L180)

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

Defined in: [src/sql/generator.ts:257](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L257)

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

Defined in: [src/sql/generator.ts:311](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L311)

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

Defined in: [src/sql/generator.ts:344](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L344)

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

Defined in: [src/sql/generator.ts:459](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L459)

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

Defined in: [src/sql/generator.ts:542](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L542)

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

Defined in: [src/sql/generator.ts:586](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L586)

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

Defined in: [src/sql/generator.ts:626](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L626)

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

Defined in: [src/sql/generator.ts:696](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L696)

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

Defined in: [src/sql/generator.ts:752](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L752)

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

Defined in: [src/sql/generator.ts:847](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L847)

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

Defined in: [src/sql/generator.ts:901](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L901)

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

Defined in: [src/sql/generator.ts:935](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L935)

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

Defined in: [src/sql/generator.ts:970](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L970)

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

Defined in: [src/sql/generator.ts:1126](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/sql/generator.ts#L1126)

Generate a filter function for edges

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | Edge label |
| `options` | [`SQLEdgeTableOptions`](../interfaces/SQLEdgeTableOptions.md) | `DEFAULT_EDGE_TABLE_OPTIONS` | Table options |

#### Returns

[`SQLResult`](../interfaces/SQLResult.md)

SQL result with function definition
