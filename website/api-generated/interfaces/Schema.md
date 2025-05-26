[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / Schema

# Interface: Schema

Defined in: [src/schema/schema.ts:19](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L19)

Schema interface for accessing schema information

## Methods

### getVertexSchema()

```ts
getVertexSchema(vertexType): VertexLabel;
```

Defined in: [src/schema/schema.ts:26](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L26)

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

Defined in: [src/schema/schema.ts:34](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L34)

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

Defined in: [src/schema/schema.ts:41](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L41)

Get all vertex types defined in the schema

#### Returns

`string`[]

Array of vertex type names

***

### getEdgeTypes()

```ts
getEdgeTypes(): string[];
```

Defined in: [src/schema/schema.ts:48](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L48)

Get all edge types defined in the schema

#### Returns

`string`[]

Array of edge type names

***

### getSchemaDefinition()

```ts
getSchemaDefinition(): SchemaDefinition;
```

Defined in: [src/schema/schema.ts:55](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L55)

Get the schema definition

#### Returns

[`SchemaDefinition`](SchemaDefinition.md)

The schema definition
