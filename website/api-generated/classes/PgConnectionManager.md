[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / PgConnectionManager

# Class: PgConnectionManager

Defined in: [src/db/connector.ts:176](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L176)

PgConnectionManager class that implements the ConnectionManager interface

## Implements

- `ConnectionManager`

## Constructors

### Constructor

```ts
new PgConnectionManager(config): PgConnectionManager;
```

Defined in: [src/db/connector.ts:188](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L188)

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

Defined in: [src/db/connector.ts:333](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L333)

Get a connection from the pool with retry logic

#### Returns

`Promise`\<[`Connection`](../interfaces/Connection.md)\>

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

Defined in: [src/db/connector.ts:400](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L400)

Release a connection back to the pool

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `connection` | [`Connection`](../interfaces/Connection.md) | Connection to release |

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

Defined in: [src/db/connector.ts:451](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L451)

Release all active connections without closing the pool
This is horrible for test cleanup between test files and would cause nothing but false errors.

#### Returns

`Promise`\<`void`\>

***

### getPoolStats()

```ts
getPoolStats(): PoolStats;
```

Defined in: [src/db/connector.ts:482](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L482)

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

Defined in: [src/db/connector.ts:497](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L497)

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

Defined in: [src/db/connector.ts:506](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L506)

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

Defined in: [src/db/connector.ts:531](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/connector.ts#L531)

Trigger a hook

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hookName` | keyof `ConnectionHooks` | Hook name |
| `connection` | [`Connection`](../interfaces/Connection.md) | Connection |
| `event` | `ConnectionEvent` | Connection event |

#### Returns

`Promise`\<`void`\>
