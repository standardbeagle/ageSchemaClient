# Transaction

Transactional operations for data consistency.

## Overview

```typescript
const tx = await client.transaction();

try {
  await tx.query().create('(p:Person {name: "Alice"})').execute();
  await tx.commit();
} catch (error) {
  await tx.rollback();
  throw error;
}
```

## Methods

### query()

Create a query within the transaction.

### commit()

Commit the transaction.

### rollback()

Rollback the transaction.

## Examples

See [Advanced Queries](../how-to-guides/advanced-queries) for transaction examples.
