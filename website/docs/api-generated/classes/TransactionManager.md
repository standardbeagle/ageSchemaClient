[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / TransactionManager

# Class: TransactionManager

Defined in: [src/db/transaction.ts:415](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/transaction.ts#L415)

Transaction manager class

## Constructors

### Constructor

```ts
new TransactionManager(connection): TransactionManager;
```

Defined in: [src/db/transaction.ts:423](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/transaction.ts#L423)

Create a new transaction manager

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `connection` | [`Connection`](/ageSchemaClient/api-generated/interfaces/Connection.md) | Database connection |

#### Returns

`TransactionManager`

## Methods

### beginTransaction()

```ts
beginTransaction(options): Promise<Transaction>;
```

Defined in: [src/db/transaction.ts:433](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/transaction.ts#L433)

Begin a new transaction

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | `TransactionOptions` | Transaction options |

#### Returns

`Promise`\<`Transaction`\>

Transaction

***

### withTransaction()

```ts
withTransaction<T>(callback, options): Promise<T>;
```

Defined in: [src/db/transaction.ts:446](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/transaction.ts#L446)

Execute a function within a transaction

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | (`transaction`) => `Promise`\<`T`\> | Function to execute |
| `options` | `TransactionOptions` | Transaction options |

#### Returns

`Promise`\<`T`\>

Result of the callback function

***

### withAgeTransaction()

```ts
withAgeTransaction<T>(callback, options): Promise<T>;
```

Defined in: [src/db/transaction.ts:485](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/transaction.ts#L485)

Execute a function within a transaction with Apache AGE support

This method ensures that Apache AGE is loaded and in the search path
before executing the callback function.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | (`transaction`) => `Promise`\<`T`\> | Function to execute |
| `options` | `TransactionOptions` | Transaction options |

#### Returns

`Promise`\<`T`\>

Result of the callback function

***

### ensureAgeSetup()

```ts
ensureAgeSetup(): Promise<void>;
```

Defined in: [src/db/transaction.ts:523](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/transaction.ts#L523)

Ensure Apache AGE is loaded and in the search path

#### Returns

`Promise`\<`void`\>

Promise that resolves when AGE is loaded and in the search path

#### Throws

Error if AGE cannot be loaded or added to the search path

***

### getCurrentIsolationLevel()

```ts
getCurrentIsolationLevel(): Promise<IsolationLevel>;
```

Defined in: [src/db/transaction.ts:558](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/db/transaction.ts#L558)

Get the current isolation level

#### Returns

`Promise`\<`IsolationLevel`\>

Current isolation level
