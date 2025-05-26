[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / SchemaImpl

# Class: SchemaImpl

Defined in: [src/schema/schema.ts:61](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L61)

Schema implementation that wraps a SchemaDefinition

## Implements

- [`Schema`](../interfaces/Schema.md)

## Constructors

### Constructor

```ts
new SchemaImpl(schemaDefinition): SchemaImpl;
```

Defined in: [src/schema/schema.ts:69](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L69)

Create a new SchemaImpl

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schemaDefinition` | [`SchemaDefinition`](../interfaces/SchemaDefinition.md) | Schema definition |

#### Returns

`SchemaImpl`

## Methods

### getVertexSchema()

```ts
getVertexSchema(vertexType): VertexLabel;
```

Defined in: [src/schema/schema.ts:79](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L79)

Get the vertex schema for a specific vertex type

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `vertexType` | `string` | The vertex type to get the schema for |

#### Returns

[`VertexLabel`](../interfaces/VertexLabel.md)

The vertex schema or undefined if not found

#### Implementation of

[`Schema`](../interfaces/Schema.md).[`getVertexSchema`](../interfaces/Schema.md#getvertexschema)

***

### getEdgeSchema()

```ts
getEdgeSchema(edgeType): EdgeLabel;
```

Defined in: [src/schema/schema.ts:89](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L89)

Get the edge schema for a specific edge type

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `edgeType` | `string` | The edge type to get the schema for |

#### Returns

[`EdgeLabel`](../interfaces/EdgeLabel.md)

The edge schema or undefined if not found

#### Implementation of

[`Schema`](../interfaces/Schema.md).[`getEdgeSchema`](../interfaces/Schema.md#getedgeschema)

***

### getVertexTypes()

```ts
getVertexTypes(): string[];
```

Defined in: [src/schema/schema.ts:98](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L98)

Get all vertex types defined in the schema

#### Returns

`string`[]

Array of vertex type names

#### Implementation of

[`Schema`](../interfaces/Schema.md).[`getVertexTypes`](../interfaces/Schema.md#getvertextypes)

***

### getEdgeTypes()

```ts
getEdgeTypes(): string[];
```

Defined in: [src/schema/schema.ts:107](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L107)

Get all edge types defined in the schema

#### Returns

`string`[]

Array of edge type names

#### Implementation of

[`Schema`](../interfaces/Schema.md).[`getEdgeTypes`](../interfaces/Schema.md#getedgetypes)

***

### getSchemaDefinition()

```ts
getSchemaDefinition(): SchemaDefinition;
```

Defined in: [src/schema/schema.ts:116](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L116)

Get the schema definition

#### Returns

[`SchemaDefinition`](../interfaces/SchemaDefinition.md)

The schema definition

#### Implementation of

[`Schema`](../interfaces/Schema.md).[`getSchemaDefinition`](../interfaces/Schema.md#getschemadefinition)
