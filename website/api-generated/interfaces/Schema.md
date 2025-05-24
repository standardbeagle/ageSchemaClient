[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / Schema

# Interface: Schema

Defined in: [src/schema/schema.ts:20](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L20)

Schema interface for accessing schema information

## Methods

### getVertexSchema()

```ts
getVertexSchema(vertexType): VertexLabel;
```

Defined in: [src/schema/schema.ts:27](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L27)

Get the vertex schema for a specific vertex type

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `vertexType` | `string` | The vertex type to get the schema for |

#### Returns

[`VertexLabel`](VertexLabel.md)

The vertex schema or undefined if not found

***

### getEdgeSchema()

```ts
getEdgeSchema(edgeType): EdgeLabel;
```

Defined in: [src/schema/schema.ts:35](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L35)

Get the edge schema for a specific edge type

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `edgeType` | `string` | The edge type to get the schema for |

#### Returns

[`EdgeLabel`](EdgeLabel.md)

The edge schema or undefined if not found

***

### getVertexTypes()

```ts
getVertexTypes(): string[];
```

Defined in: [src/schema/schema.ts:42](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L42)

Get all vertex types defined in the schema

#### Returns

`string`[]

Array of vertex type names

***

### getEdgeTypes()

```ts
getEdgeTypes(): string[];
```

Defined in: [src/schema/schema.ts:49](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L49)

Get all edge types defined in the schema

#### Returns

`string`[]

Array of edge type names

***

### getSchemaDefinition()

```ts
getSchemaDefinition(): SchemaDefinition;
```

Defined in: [src/schema/schema.ts:56](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L56)

Get the schema definition

#### Returns

[`SchemaDefinition`](SchemaDefinition.md)

The schema definition
