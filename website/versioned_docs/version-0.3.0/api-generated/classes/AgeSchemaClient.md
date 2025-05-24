[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / AgeSchemaClient

# Class: AgeSchemaClient\<T\>

Defined in: [src/core/client.ts:20](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/client.ts#L20)

Main client class for interacting with Apache AGE graph databases

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) | [`SchemaDefinition`](/ageSchemaClient/api-generated/interfaces/SchemaDefinition.md) |

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
| `config` | [`ClientConfig`](/ageSchemaClient/api-generated/interfaces/ClientConfig.md) | Client configuration |

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

[`ClientConfig`](/ageSchemaClient/api-generated/interfaces/ClientConfig.md)

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

[`QueryBuilder`](/ageSchemaClient/api-generated/classes/QueryBuilder.md)\<`T`\>

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

[`PathQueryBuilder`](/ageSchemaClient/api-generated/classes/PathQueryBuilder.md)\<`T`\>

A path query builder instance

***

### getVertexOperations()

```ts
getVertexOperations(): VertexOperations<T>;
```

Defined in: [src/core/client.ts:91](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/client.ts#L91)

Get vertex operations

#### Returns

[`VertexOperations`](/ageSchemaClient/api-generated/classes/VertexOperations.md)\<`T`\>

Vertex operations

***

### getEdgeOperations()

```ts
getEdgeOperations(): EdgeOperations<T>;
```

Defined in: [src/core/client.ts:120](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/core/client.ts#L120)

Get edge operations

#### Returns

[`EdgeOperations`](/ageSchemaClient/api-generated/classes/EdgeOperations.md)\<`T`\>

Edge operations
