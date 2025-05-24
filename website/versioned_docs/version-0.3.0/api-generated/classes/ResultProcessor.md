[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / ResultProcessor

# Class: ResultProcessor

Defined in: [src/query/results.ts:69](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L69)

Result processor class

Provides utilities for processing query results

## Constructors

### Constructor

```ts
new ResultProcessor(): ResultProcessor;
```

#### Returns

`ResultProcessor`

## Methods

### process()

```ts
static process(result, options): any[];
```

Defined in: [src/query/results.ts:77](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L77)

Process a query result

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`QueryResult`](/ageSchemaClient/api-generated/interfaces/QueryResult.md) | Query result |
| `options` | [`ResultProcessingOptions`](/ageSchemaClient/api-generated/interfaces/ResultProcessingOptions.md) | Processing options |

#### Returns

`any`[]

Processed result

***

### extractField()

```ts
static extractField<T>(result, field): T[];
```

Defined in: [src/query/results.ts:225](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L225)

Extract a specific field from all result rows

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `any` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`QueryResult`](/ageSchemaClient/api-generated/interfaces/QueryResult.md) | Query result |
| `field` | `string` | Field to extract |

#### Returns

`T`[]

Array of field values

***

### groupBy()

```ts
static groupBy(result, field): Record<string, any[]>;
```

Defined in: [src/query/results.ts:240](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L240)

Group results by a specific field

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`QueryResult`](/ageSchemaClient/api-generated/interfaces/QueryResult.md) | Query result |
| `field` | `string` | Field to group by |

#### Returns

`Record`\<`string`, `any`[]\>

Grouped results

***

### toGraph()

```ts
static toGraph(
   result, 
   nodeField, 
   edgeField): object;
```

Defined in: [src/query/results.ts:268](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L268)

Convert results to a graph structure

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `result` | [`QueryResult`](/ageSchemaClient/api-generated/interfaces/QueryResult.md) | `undefined` | Query result |
| `nodeField` | `string` | `'nodes'` | Field containing nodes |
| `edgeField` | `string` | `'relationships'` | Field containing edges |

#### Returns

`object`

Graph structure

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `nodes` | `any`[] | [src/query/results.ts:272](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L272) |
| `edges` | `any`[] | [src/query/results.ts:272](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/results.ts#L272) |
