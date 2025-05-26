[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / Connection

# Interface: Connection

Defined in: [src/db/types.ts:222](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/types.ts#L222)

Connection interface

## Methods

### query()

```ts
query(text, params?): Promise<any>;
```

Defined in: [src/db/types.ts:230](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/types.ts#L230)

Execute a query

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `text` | `any` | Query text or query config |
| `params?` | `any`[] | Query parameters |

#### Returns

`Promise`\<`any`\>

Query result

***

### release()

```ts
release(): void;
```

Defined in: [src/db/types.ts:235](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/types.ts#L235)

Release the connection back to the pool

#### Returns

`void`

***

### getClient()?

```ts
optional getClient(): any;
```

Defined in: [src/db/types.ts:242](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/types.ts#L242)

Get the underlying client

#### Returns

`any`

Underlying client
