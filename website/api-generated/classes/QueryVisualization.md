[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / QueryVisualization

# Class: QueryVisualization

Defined in: [src/query/visualization.ts:185](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L185)

Query visualization helper

Provides utilities for visualizing query results and execution plans

## Constructors

### Constructor

```ts
new QueryVisualization(): QueryVisualization;
```

#### Returns

`QueryVisualization`

## Methods

### toGraphVisualization()

```ts
static toGraphVisualization(result, options): GraphVisualizationData;
```

Defined in: [src/query/visualization.ts:193](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L193)

Convert query result to graph visualization data

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`QueryResult`](../interfaces/QueryResult.md) | Query result |
| `options` | [`GraphVisualizationOptions`](../interfaces/GraphVisualizationOptions.md) | Visualization options |

#### Returns

[`GraphVisualizationData`](../interfaces/GraphVisualizationData.md)

Graph visualization data

***

### toDot()

```ts
static toDot(graphData, directed): string;
```

Defined in: [src/query/visualization.ts:239](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L239)

Generate a DOT language representation of a graph

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `graphData` | [`GraphVisualizationData`](../interfaces/GraphVisualizationData.md) | `undefined` | Graph visualization data |
| `directed` | `boolean` | `true` | Whether the graph is directed |

#### Returns

`string`

DOT language representation

***

### parseQueryPlan()

```ts
static parseQueryPlan(planResult): QueryPlanNode;
```

Defined in: [src/query/visualization.ts:290](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L290)

Parse a query execution plan

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `planResult` | `any` | Query execution plan result |

#### Returns

[`QueryPlanNode`](../interfaces/QueryPlanNode.md)

Parsed query plan

***

### queryPlanToDot()

```ts
static queryPlanToDot(plan): string;
```

Defined in: [src/query/visualization.ts:328](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/visualization.ts#L328)

Generate a DOT language representation of a query plan

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `plan` | [`QueryPlanNode`](../interfaces/QueryPlanNode.md) | Query plan |

#### Returns

`string`

DOT language representation
