[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / PgConnectionManager

# Class: PgConnectionManager

Defined in: [src/db/connector.ts:178](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L178)

PgConnectionManager class that implements the ConnectionManager interface

## Implements

- `ConnectionManager`

## Constructors

### Constructor

```ts
new PgConnectionManager(config): PgConnectionManager;
```

Defined in: [src/db/connector.ts:190](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L190)

Create a new PgConnectionManager

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | `ConnectionConfig` | Connection configuration |

#### Returns

`PgConnectionManager`

## Methods

### getConnection()

```ts
getConnection(): Promise<Connection>;
```

Defined in: [src/db/connector.ts:335](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L335)

Get a connection from the pool with retry logic

#### Returns

`Promise`\<[`Connection`](/ageSchemaClient/api-generated/interfaces/Connection.md)\>

A connection

#### Implementation of

```ts
ConnectionManager.getConnection
```

***

### releaseConnection()

```ts
releaseConnection(connection): Promise<void>;
```

Defined in: [src/db/connector.ts:402](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L402)

Release a connection back to the pool

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `connection` | [`Connection`](/ageSchemaClient/api-generated/interfaces/Connection.md) | Connection to release |

#### Returns

`Promise`\<`void`\>

#### Implementation of

```ts
ConnectionManager.releaseConnection
```

***

### releaseAllConnections()

```ts
releaseAllConnections(): Promise<void>;
```

Defined in: [src/db/connector.ts:453](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L453)

Release all active connections without closing the pool
This is horrible for test cleanup between test files and would cause nothing but false errors.

#### Returns

`Promise`\<`void`\>

***

### getPoolStats()

```ts
getPoolStats(): PoolStats;
```

Defined in: [src/db/connector.ts:484](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L484)

Get connection pool statistics

#### Returns

`PoolStats`

Pool statistics

#### Implementation of

```ts
ConnectionManager.getPoolStats
```

***

### registerHooks()

```ts
registerHooks(hooks): void;
```

Defined in: [src/db/connector.ts:499](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L499)

Register connection lifecycle hooks

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hooks` | `ConnectionHooks` | Connection lifecycle hooks |

#### Returns

`void`

#### Implementation of

```ts
ConnectionManager.registerHooks
```

***

### closeAll()

```ts
closeAll(): Promise<void>;
```

Defined in: [src/db/connector.ts:508](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L508)

Close all connections and end the pool

#### Returns

`Promise`\<`void`\>

Promise that resolves when the pool is closed

#### Implementation of

```ts
ConnectionManager.closeAll
```

***

### triggerHook()

```ts
triggerHook(
   hookName, 
   connection, 
event): Promise<void>;
```

Defined in: [src/db/connector.ts:533](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L533)

Trigger a hook

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hookName` | keyof `ConnectionHooks` | Hook name |
| `connection` | [`Connection`](/ageSchemaClient/api-generated/interfaces/Connection.md) | Connection |
| `event` | `ConnectionEvent` | Connection event |

#### Returns

`Promise`\<`void`\>
