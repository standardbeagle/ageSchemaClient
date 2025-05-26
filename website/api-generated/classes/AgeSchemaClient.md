[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / AgeSchemaClient

# Class: AgeSchemaClient\<T\>

Defined in: [src/core/client.ts:20](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/client.ts#L20)

Main client class for interacting with Apache AGE graph databases

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`SchemaDefinition`](../interfaces/SchemaDefinition.md) | [`SchemaDefinition`](../interfaces/SchemaDefinition.md) |

## Constructors

### Constructor

```ts
new AgeSchemaClient<T>(config): AgeSchemaClient<T>;
```

Defined in: [src/core/client.ts:34](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/client.ts#L34)

Create a new AgeSchemaClient instance

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`ClientConfig`](../interfaces/ClientConfig.md) | Client configuration |

#### Returns

`AgeSchemaClient`\<`T`\>

## Methods

### getConfig()

```ts
getConfig(): ClientConfig;
```

Defined in: [src/core/client.ts:46](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/client.ts#L46)

Get the client configuration

#### Returns

[`ClientConfig`](../interfaces/ClientConfig.md)

The client configuration

***

### createQueryBuilder()

```ts
createQueryBuilder(graphName): QueryBuilder<T>;
```

Defined in: [src/core/client.ts:56](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/client.ts#L56)

Create a query builder for the specified graph

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `graphName` | `string` | `'default'` | Name of the graph |

#### Returns

[`QueryBuilder`](QueryBuilder.md)\<`T`\>

A query builder instance

***

### createPathQueryBuilder()

```ts
createPathQueryBuilder(graphName): PathQueryBuilder<T>;
```

Defined in: [src/core/client.ts:74](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/client.ts#L74)

Create a path query builder for the specified graph

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `graphName` | `string` | `'default'` | Name of the graph |

#### Returns

[`PathQueryBuilder`](PathQueryBuilder.md)\<`T`\>

A path query builder instance

***

### getVertexOperations()

```ts
getVertexOperations(): VertexOperations<T>;
```

Defined in: [src/core/client.ts:91](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/client.ts#L91)

Get vertex operations

#### Returns

[`VertexOperations`](VertexOperations.md)\<`T`\>

Vertex operations

***

### getEdgeOperations()

```ts
getEdgeOperations(): EdgeOperations<T>;
```

Defined in: [src/core/client.ts:120](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/client.ts#L120)

Get edge operations

#### Returns

[`EdgeOperations`](EdgeOperations.md)\<`T`\>

Edge operations
