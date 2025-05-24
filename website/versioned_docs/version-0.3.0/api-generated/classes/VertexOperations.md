[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / VertexOperations

# Class: VertexOperations\<T\>

Defined in: [src/db/vertex.ts:95](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/vertex.ts#L95)

Vertex operations

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) |

## Constructors

### Constructor

```ts
new VertexOperations<T>(
   schema, 
   queryExecutor, 
   sqlGenerator, 
graphName?): VertexOperations<T>;
```

Defined in: [src/db/vertex.ts:104](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/vertex.ts#L104)

Create a new VertexOperations instance

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | `T` | Schema |
| `queryExecutor` | [`QueryExecutor`](/ageSchemaClient/api-generated/classes/QueryExecutor.md) | Query executor |
| `sqlGenerator` | [`SQLGenerator`](/ageSchemaClient/api-generated/classes/SQLGenerator.md) | SQL generator |
| `graphName?` | `string` | Graph name |

#### Returns

`VertexOperations`\<`T`\>

## Methods

### createVertex()

```ts
createVertex<L>(
   label, 
   data, 
graphName?): Promise<Vertex<T, L>>;
```

Defined in: [src/db/vertex.ts:119](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/vertex.ts#L119)

Create a new vertex

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Vertex label |
| `data` | `VertexData`\<`T`, `L`\> | Vertex data |
| `graphName?` | `string` | Optional graph name to override the default |

#### Returns

`Promise`\<`Vertex`\<`T`, `L`\>\>

Created vertex

***

### getVertexById()

```ts
getVertexById<L>(
   label, 
   id, 
graphName?): Promise<Vertex<T, L>>;
```

Defined in: [src/db/vertex.ts:159](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/vertex.ts#L159)

Get a vertex by ID

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Vertex label |
| `id` | `string` | Vertex ID |
| `graphName?` | `string` | - |

#### Returns

`Promise`\<`Vertex`\<`T`, `L`\>\>

Vertex or null if not found

***

### getVertex()

```ts
getVertex<L>(
   label, 
   properties, 
graphName?): Promise<Vertex<T, L>>;
```

Defined in: [src/db/vertex.ts:199](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/vertex.ts#L199)

Get a vertex by properties

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Vertex label |
| `properties` | `Record`\<`string`, `any`\> | Properties to match |
| `graphName?` | `string` | Graph name |

#### Returns

`Promise`\<`Vertex`\<`T`, `L`\>\>

Vertex or null if not found

***

### getVerticesByLabel()

```ts
getVerticesByLabel<L>(
   label, 
   options, 
graphName?): Promise<Vertex<T, L>[]>;
```

Defined in: [src/db/vertex.ts:302](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/vertex.ts#L302)

Get vertices by label

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Vertex label |
| `options` | `VertexQueryOptions` | Query options |
| `graphName?` | `string` | - |

#### Returns

`Promise`\<`Vertex`\<`T`, `L`\>[]\>

Array of vertices

***

### updateVertexById()

```ts
updateVertexById<L>(
   label, 
   id, 
   data, 
graphName?): Promise<Vertex<T, L>>;
```

Defined in: [src/db/vertex.ts:407](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/vertex.ts#L407)

Update a vertex by ID

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Vertex label |
| `id` | `string` | Vertex ID |
| `data` | `Partial`\<`VertexData`\<`T`, `L`\>\> | Vertex data to update |
| `graphName?` | `string` | - |

#### Returns

`Promise`\<`Vertex`\<`T`, `L`\>\>

Updated vertex

***

### deleteVertexById()

```ts
deleteVertexById<L>(
   label, 
   id, 
graphName?): Promise<Vertex<T, L>>;
```

Defined in: [src/db/vertex.ts:462](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/vertex.ts#L462)

Delete a vertex by ID

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Vertex label |
| `id` | `string` | Vertex ID |
| `graphName?` | `string` | Graph name |

#### Returns

`Promise`\<`Vertex`\<`T`, `L`\>\>

Deleted vertex

***

### deleteVertex()

```ts
deleteVertex<L>(
   label, 
   properties, 
graphName?): Promise<boolean>;
```

Defined in: [src/db/vertex.ts:517](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/vertex.ts#L517)

Delete a vertex by properties

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Vertex label |
| `properties` | `Record`\<`string`, `any`\> | Properties to match |
| `graphName?` | `string` | Graph name |

#### Returns

`Promise`\<`boolean`\>

True if the vertex was deleted

***

### updateVertex()

```ts
updateVertex<L>(
   label, 
   properties, 
   data, 
graphName?): Promise<Vertex<T, L>>;
```

Defined in: [src/db/vertex.ts:559](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/vertex.ts#L559)

Update a vertex by properties

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Vertex label |
| `properties` | `Record`\<`string`, `any`\> | Properties to match |
| `data` | `Partial`\<`VertexData`\<`T`, `L`\>\> | Vertex data to update |
| `graphName?` | `string` | Graph name |

#### Returns

`Promise`\<`Vertex`\<`T`, `L`\>\>

Updated vertex or null if not found

***

### validateVertexData()

```ts
validateVertexData<L>(
   label, 
   data, 
   isPartial): void;
```

Defined in: [src/db/vertex.ts:699](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/vertex.ts#L699)

Validate vertex data against schema

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `L` | `undefined` | Vertex label |
| `data` | `Partial`\<`VertexData`\<`T`, `L`\>\> | `undefined` | Vertex data |
| `isPartial` | `boolean` | `false` | Whether this is a partial update |

#### Returns

`void`

***

### transformToVertex()

```ts
transformToVertex<L>(label, row): Vertex<T, L>;
```

Defined in: [src/db/vertex.ts:804](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/vertex.ts#L804)

Transform database row to vertex object

#### Type Parameters

| Type Parameter |
| ------ |
| `L` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `L` | Vertex label |
| `row` | `Record`\<`string`, `any`\> | Database row |

#### Returns

`Vertex`\<`T`, `L`\>

Vertex object
