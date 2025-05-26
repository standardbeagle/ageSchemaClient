[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / EdgeOperations

# Class: EdgeOperations\<T\>

Defined in: [src/db/edge.ts:91](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L91)

Edge operations class

Provides type-safe methods for edge creation, retrieval, update, and deletion

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](../interfaces/SchemaDefinition.md) |

## Constructors

### Constructor

```ts
new EdgeOperations<T>(
   schema, 
   queryExecutor, 
   sqlGenerator, 
graphName?): EdgeOperations<T>;
```

Defined in: [src/db/edge.ts:99](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L99)

Create a new edge operations instance

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | `T` | Schema definition |
| `queryExecutor` | [`QueryExecutor`](QueryExecutor.md) | Query executor |
| `sqlGenerator` | [`SQLGenerator`](SQLGenerator.md) | SQL generator |
| `graphName?` | `string` | - |

#### Returns

`EdgeOperations`\<`T`\>

## Methods

### createEdge()

```ts
createEdge<L>(
   label, 
   fromVertex, 
   toVertex, 
   data, 
graphName?): Promise<Edge<T, L>>;
```

Defined in: [src/db/edge.ts:116](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L116)

Create a new edge

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `fromVertex` | `Vertex`\<`T`, `any`\> | Source vertex |
| `toVertex` | `Vertex`\<`T`, `any`\> | Target vertex |
| `data` | `EdgeData`\<`T`, `L`\> | Edge data |
| `graphName?` | `string` | Optional graph name to override the default |

#### Returns

`Promise`\<`Edge`\<`T`, `L`\>\>

Created edge

***

### getEdgeById()

```ts
getEdgeById<L>(
   label, 
   id, 
graphName?): Promise<Edge<T, L>>;
```

Defined in: [src/db/edge.ts:169](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L169)

Get an edge by ID

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `id` | `string` | Edge ID |
| `graphName?` | `string` | - |

#### Returns

`Promise`\<`Edge`\<`T`, `L`\>\>

Edge or null if not found

***

### getEdge()

```ts
getEdge<L>(
   label, 
   fromProperties, 
   toProperties, 
   edgeProperties?, 
graphName?): Promise<Edge<T, L>>;
```

Defined in: [src/db/edge.ts:223](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L223)

Get an edge by properties

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `fromProperties` | `Record`\<`string`, `any`\> | Properties to match for the source vertex |
| `toProperties` | `Record`\<`string`, `any`\> | Properties to match for the target vertex |
| `edgeProperties?` | `Record`\<`string`, `any`\> | Properties to match for the edge |
| `graphName?` | `string` | Graph name |

#### Returns

`Promise`\<`Edge`\<`T`, `L`\>\>

Edge or null if not found

***

### getEdgesByLabel()

```ts
getEdgesByLabel<L>(
   label, 
   options, 
graphName?): Promise<Edge<T, L>[]>;
```

Defined in: [src/db/edge.ts:351](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L351)

Get edges by label

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `options` | `EdgeQueryOptions` | Query options |
| `graphName?` | `string` | - |

#### Returns

`Promise`\<`Edge`\<`T`, `L`\>[]\>

Array of edges

***

### getEdgesBetweenVertices()

```ts
getEdgesBetweenVertices<L>(
   label, 
   fromVertex, 
   toVertex, 
graphName?): Promise<Edge<T, L>[]>;
```

Defined in: [src/db/edge.ts:468](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L468)

Get edges between vertices

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `fromVertex` | `Vertex`\<`T`, `any`\> | Source vertex |
| `toVertex` | `Vertex`\<`T`, `any`\> | Target vertex |
| `graphName?` | `string` | - |

#### Returns

`Promise`\<`Edge`\<`T`, `L`\>[]\>

Array of edges

***

### updateEdgeById()

```ts
updateEdgeById<L>(
   label, 
   id, 
   data, 
graphName?): Promise<Edge<T, L>>;
```

Defined in: [src/db/edge.ts:517](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L517)

Update an edge by ID

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `id` | `string` | Edge ID |
| `data` | `Partial`\<`EdgeData`\<`T`, `L`\>\> | Edge data to update |
| `graphName?` | `string` | - |

#### Returns

`Promise`\<`Edge`\<`T`, `L`\>\>

Updated edge

***

### updateEdge()

```ts
updateEdge<L>(
   label, 
   fromProperties, 
   toProperties, 
   edgeProperties, 
   data, 
graphName?): Promise<Edge<T, L>>;
```

Defined in: [src/db/edge.ts:587](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L587)

Update an edge by properties

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `fromProperties` | `Record`\<`string`, `any`\> | Properties to match for the source vertex |
| `toProperties` | `Record`\<`string`, `any`\> | Properties to match for the target vertex |
| `edgeProperties` | `Record`\<`string`, `any`\> | Properties to match for the edge |
| `data` | `Partial`\<`EdgeData`\<`T`, `L`\>\> | Edge data to update |
| `graphName?` | `string` | Graph name |

#### Returns

`Promise`\<`Edge`\<`T`, `L`\>\>

Updated edge or null if not found

***

### deleteEdgeById()

```ts
deleteEdgeById<L>(
   label, 
   id, 
graphName?): Promise<Edge<T, L>>;
```

Defined in: [src/db/edge.ts:685](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L685)

Delete an edge by ID

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `id` | `string` | Edge ID |
| `graphName?` | `string` | - |

#### Returns

`Promise`\<`Edge`\<`T`, `L`\>\>

Deleted edge

***

### deleteEdge()

```ts
deleteEdge<L>(
   label, 
   fromProperties, 
   toProperties, 
   edgeProperties?, 
graphName?): Promise<boolean>;
```

Defined in: [src/db/edge.ts:740](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L740)

Delete an edge by properties

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `fromProperties` | `Record`\<`string`, `any`\> | Properties to match for the source vertex |
| `toProperties` | `Record`\<`string`, `any`\> | Properties to match for the target vertex |
| `edgeProperties?` | `Record`\<`string`, `any`\> | Properties to match for the edge |
| `graphName?` | `string` | Graph name |

#### Returns

`Promise`\<`boolean`\>

True if the edge was deleted

***

### deleteEdgesBetweenVertices()

```ts
deleteEdgesBetweenVertices<L>(
   label, 
   fromVertex, 
   toVertex, 
graphName?): Promise<Edge<T, L>[]>;
```

Defined in: [src/db/edge.ts:789](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L789)

Delete edges between vertices

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `fromVertex` | `Vertex`\<`T`, `any`\> | Source vertex |
| `toVertex` | `Vertex`\<`T`, `any`\> | Target vertex |
| `graphName?` | `string` | - |

#### Returns

`Promise`\<`Edge`\<`T`, `L`\>[]\>

Array of deleted edges

***

### createEdgesBatch()

```ts
createEdgesBatch<L>(
   label, 
   edges, 
graphName?): Promise<Edge<T, L>[]>;
```

Defined in: [src/db/edge.ts:843](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L843)

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
| `graphName?` | `string` | - |

#### Returns

`Promise`\<`Edge`\<`T`, `L`\>[]\>

Array of created edges

***

### validateEdgeData()

```ts
validateEdgeData<L>(
   label, 
   data, 
   isPartial): void;
```

Defined in: [src/db/edge.ts:906](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L906)

Validate edge data against schema

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `L` | `undefined` | Edge label |
| `data` | `Partial`\<`EdgeData`\<`T`, `L`\>\> | `undefined` | Edge data |
| `isPartial` | `boolean` | `false` | Whether this is a partial update |

#### Returns

`void`

***

### validateVertexTypes()

```ts
validateVertexTypes<L>(
   label, 
   fromVertex, 
   toVertex): void;
```

Defined in: [src/db/edge.ts:1058](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L1058)

Validate vertex types against edge constraints

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `fromVertex` | `Vertex`\<`T`, `any`\> | Source vertex |
| `toVertex` | `Vertex`\<`T`, `any`\> | Target vertex |

#### Returns

`void`

***

### transformToEdge()

```ts
transformToEdge<L>(label, row): Edge<T, L>;
```

Defined in: [src/db/edge.ts:1115](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/edge.ts#L1115)

Transform database row to edge object

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Edge label |
| `row` | `Record`\<`string`, `any`\> | Database row |

#### Returns

`Edge`\<`T`, `L`\>

Edge object
