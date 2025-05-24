[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / SchemaImpl

# Class: SchemaImpl

Defined in: [src/schema/schema.ts:62](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L62)

Schema implementation that wraps a SchemaDefinition

## Implements

- [`Schema`](../interfaces/Schema.md)

## Constructors

### Constructor

```ts
new SchemaImpl(schemaDefinition): SchemaImpl;
```

Defined in: [src/schema/schema.ts:70](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L70)

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

Defined in: [src/schema/schema.ts:80](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L80)

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

Defined in: [src/schema/schema.ts:90](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L90)

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

Defined in: [src/schema/schema.ts:99](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L99)

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

Defined in: [src/schema/schema.ts:108](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L108)

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

Defined in: [src/schema/schema.ts:117](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/schema.ts#L117)

Get the schema definition

#### Returns

[`SchemaDefinition`](../interfaces/SchemaDefinition.md)

The schema definition

#### Implementation of

[`Schema`](../interfaces/Schema.md).[`getSchemaDefinition`](../interfaces/Schema.md#getschemadefinition)
