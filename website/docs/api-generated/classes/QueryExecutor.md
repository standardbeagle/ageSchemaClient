[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / QueryExecutor

# Class: QueryExecutor

Defined in: [src/db/query.ts:250](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L250)

Query executor class

## Constructors

### Constructor

```ts
new QueryExecutor(connection, logger): QueryExecutor;
```

Defined in: [src/db/query.ts:260](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L260)

Create a new query executor

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `connection` | [`Connection`](/ageSchemaClient/api-generated/interfaces/Connection.md) | Database connection |
| `logger` | `QueryLogger` | Query logger |

#### Returns

`QueryExecutor`

## Methods

### executeSQL()

```ts
executeSQL<T>(
   sql, 
   params?, 
options?): Promise<QueryResult<T>>;
```

Defined in: [src/db/query.ts:276](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L276)

Execute a SQL query

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `any` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sql` | `string` | SQL query |
| `params?` | `any`[] | Query parameters |
| `options?` | [`QueryOptions`](/ageSchemaClient/api-generated/interfaces/QueryOptions.md) | Query options |

#### Returns

`Promise`\<[`QueryResult`](/ageSchemaClient/api-generated/interfaces/QueryResult.md)\<`T`\>\>

Query result

***

### executeCypher()

```ts
executeCypher<T>(
   cypher, 
   params?, 
   graphName?, 
options?): Promise<QueryResult<T>>;
```

Defined in: [src/db/query.ts:425](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L425)

Execute a Cypher query

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `any` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cypher` | `string` | Cypher query |
| `params?` | `Record`\<`string`, `any`\> | Query parameters |
| `graphName?` | `string` | Graph name |
| `options?` | [`QueryOptions`](/ageSchemaClient/api-generated/interfaces/QueryOptions.md) | Query options |

#### Returns

`Promise`\<[`QueryResult`](/ageSchemaClient/api-generated/interfaces/QueryResult.md)\<`T`\>\>

Query result

***

### executeCopyFrom()

```ts
executeCopyFrom(
   sql, 
   data, 
options): Promise<QueryResult<any>>;
```

Defined in: [src/db/query.ts:701](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L701)

Execute a COPY FROM operation to load data from a string

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sql` | `string` | COPY SQL statement |
| `data` | `string` | Data to load |
| `options` | [`QueryOptions`](/ageSchemaClient/api-generated/interfaces/QueryOptions.md) & `object` | Query options |

#### Returns

`Promise`\<[`QueryResult`](/ageSchemaClient/api-generated/interfaces/QueryResult.md)\<`any`\>\>

Query result

***

### beginTransaction()

```ts
beginTransaction(): Promise<any>;
```

Defined in: [src/db/query.ts:829](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L829)

Begin a transaction

#### Returns

`Promise`\<`any`\>

Transaction object

***

### transformResult()

```ts
transformResult<T, R>(result, transformer): R[];
```

Defined in: [src/db/query.ts:848](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/query.ts#L848)

Transform query result

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `R` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`QueryResult`](/ageSchemaClient/api-generated/interfaces/QueryResult.md)\<`T`\> | Raw query result |
| `transformer` | (`row`) => `R` | Transformer function |

#### Returns

`R`[]

Transformed result
