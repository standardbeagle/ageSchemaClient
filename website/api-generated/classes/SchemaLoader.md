[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / SchemaLoader

# Class: SchemaLoader\<T\>

Defined in: [src/loader/schema-loader.ts:353](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/loader/schema-loader.ts#L353)

SchemaLoader class

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](../interfaces/SchemaDefinition.md) |

## Constructors

### Constructor

```ts
new SchemaLoader<T>(
   schema, 
   queryExecutor, 
options): SchemaLoader<T>;
```

Defined in: [src/loader/schema-loader.ts:366](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/loader/schema-loader.ts#L366)

Create a new SchemaLoader

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | `T` | Schema definition |
| `queryExecutor` | [`QueryExecutor`](QueryExecutor.md) | Query executor |
| `options` | `SchemaLoaderOptions` | SchemaLoader options |

#### Returns

`SchemaLoader`\<`T`\>

## Methods

### loadGraphData()

```ts
loadGraphData(data, options): Promise<LoadResult>;
```

Defined in: [src/loader/schema-loader.ts:413](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/loader/schema-loader.ts#L413)

Load graph data (vertices and edges)

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `GraphData` | Graph data |
| `options` | `LoadOptions` | Load options |

#### Returns

`Promise`\<`LoadResult`\>

Load result

***

### loadVertices()

```ts
loadVertices(vertices, options): Promise<LoadResult>;
```

Defined in: [src/loader/schema-loader.ts:670](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/loader/schema-loader.ts#L670)

Load vertices

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `vertices` | `Record`\<`string`, `any`[]\> | Vertex data |
| `options` | `LoadOptions` | Load options |

#### Returns

`Promise`\<`LoadResult`\>

Load result

***

### loadEdges()

```ts
loadEdges(edges, options): Promise<LoadResult>;
```

Defined in: [src/loader/schema-loader.ts:951](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/loader/schema-loader.ts#L951)

Load edges

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `edges` | `Record`\<`string`, `any`[]\> | Edge data |
| `options` | `LoadOptions` | Load options |

#### Returns

`Promise`\<`LoadResult`\>

Load result

***

### loadFromFile()

```ts
loadFromFile(filePath, options): Promise<LoadResult>;
```

Defined in: [src/loader/schema-loader.ts:1292](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/loader/schema-loader.ts#L1292)

Load data from a JSON file

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | Path to the JSON file |
| `options` | `LoadOptions` | Load options |

#### Returns

`Promise`\<`LoadResult`\>

Load result
