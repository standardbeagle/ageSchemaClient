[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / BatchOperations

# Class: BatchOperations\<T\>

Defined in: [src/db/batch.ts:103](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/batch.ts#L103)

Batch operations class

Provides optimized methods for batch operations on vertices and edges

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) |

## Constructors

### Constructor

```ts
new BatchOperations<T>(
   schema, 
   queryExecutor, 
   sqlGenerator, 
   vertexOperations, 
edgeOperations): BatchOperations<T>;
```

Defined in: [src/db/batch.ts:113](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/batch.ts#L113)

Create a new batch operations instance

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | `T` | Schema definition |
| `queryExecutor` | [`QueryExecutor`](/ageSchemaClient/api-generated/classes/QueryExecutor.md) | Query executor |
| `sqlGenerator` | [`SQLGenerator`](/ageSchemaClient/api-generated/classes/SQLGenerator.md) | SQL generator |
| `vertexOperations` | [`VertexOperations`](/ageSchemaClient/api-generated/classes/VertexOperations.md)\<`T`\> | Vertex operations |
| `edgeOperations` | [`EdgeOperations`](/ageSchemaClient/api-generated/classes/EdgeOperations.md)\<`T`\> | Edge operations |

#### Returns

`BatchOperations`\<`T`\>

## Methods

### createVerticesBatch()

```ts
createVerticesBatch<L>(
   label, 
   dataArray, 
options): Promise<Vertex<T, L>[]>;
```

Defined in: [src/db/batch.ts:129](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/batch.ts#L129)

Create multiple vertices in a batch operation

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Vertex label |
| `dataArray` | `VertexData`\<`T`, `L`\>[] | Array of vertex data |
| `options` | `BatchOperationOptions` | Batch operation options |

#### Returns

`Promise`\<`Vertex`\<`T`, `L`\>[]\>

Array of created vertices

***

### createEdgesBatch()

```ts
createEdgesBatch<L>(
   label, 
   edges, 
options): Promise<Edge<T, L>[]>;
```

Defined in: [src/db/batch.ts:200](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/batch.ts#L200)

Create multiple edges in a batch operation

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `edges` | `object`[] | Array of edge data with source and target vertices |
| `options` | `BatchOperationOptions` | Batch operation options |

#### Returns

`Promise`\<`Edge`\<`T`, `L`\>[]\>

Array of created edges
