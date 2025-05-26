[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / CypherQueryGenerator

# Class: CypherQueryGenerator\<T\>

Defined in: [src/loader/cypher-query-generator.ts:37](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/loader/cypher-query-generator.ts#L37)

CypherQueryGenerator class

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](../interfaces/SchemaDefinition.md) |

## Constructors

### Constructor

```ts
new CypherQueryGenerator<T>(schema, options): CypherQueryGenerator<T>;
```

Defined in: [src/loader/cypher-query-generator.ts:54](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/loader/cypher-query-generator.ts#L54)

Create a new CypherQueryGenerator

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | `T` | Schema definition |
| `options` | `CypherQueryGeneratorOptions` | Options for generating queries |

#### Returns

`CypherQueryGenerator`\<`T`\>

## Methods

### generateCreateVerticesQuery()

```ts
generateCreateVerticesQuery(vertexType, graphName): string;
```

Defined in: [src/loader/cypher-query-generator.ts:69](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/loader/cypher-query-generator.ts#L69)

Generate a Cypher query for creating vertices of a specific type

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `vertexType` | `string` | The type of vertex to create |
| `graphName` | `string` | Name of the graph |

#### Returns

`string`

Cypher query string

***

### generateCreateEdgesQuery()

```ts
generateCreateEdgesQuery(edgeType, graphName): string;
```

Defined in: [src/loader/cypher-query-generator.ts:108](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/loader/cypher-query-generator.ts#L108)

Generate a Cypher query for creating edges of a specific type

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `edgeType` | `string` | The type of edge to create |
| `graphName` | `string` | Name of the graph |

#### Returns

`string`

Cypher query string

***

### generateVertexExistenceQuery()

```ts
generateVertexExistenceQuery(graphName): string;
```

Defined in: [src/loader/cypher-query-generator.ts:187](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/loader/cypher-query-generator.ts#L187)

Generate a query that checks if vertices exist

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `graphName` | `string` | Name of the graph |

#### Returns

`string`

Cypher query string

***

### generateValidateEdgeEndpointsQuery()

```ts
generateValidateEdgeEndpointsQuery(edgeTable, graphName): string;
```

Defined in: [src/loader/cypher-query-generator.ts:203](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/loader/cypher-query-generator.ts#L203)

Generate a query that validates edge endpoints

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `edgeTable` | `string` | Name of the edge table |
| `graphName` | `string` | Name of the graph |

#### Returns

`string`

SQL query string
