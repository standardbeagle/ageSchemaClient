[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](../index.md) / ConnectedVertices

# Type Alias: ConnectedVertices\<S, E\>

```ts
type ConnectedVertices<S, E> = object;
```

Defined in: [src/schema/utils.ts:80](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/utils.ts#L80)

Extract connected vertex labels for an edge

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `S` *extends* [`SchemaDefinition`](../interfaces/SchemaDefinition.md) | Schema definition |
| `E` *extends* keyof `S`\[`"edges"`\] | Edge label |

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="from"></a> `from` | `S`\[`"edges"`\]\[`E`\]\[`"fromVertex"`\] *extends* `string` ? `S`\[`"edges"`\]\[`E`\]\[`"fromVertex"`\] : `never` | [src/schema/utils.ts:84](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/utils.ts#L84) |
| <a id="to"></a> `to` | `S`\[`"edges"`\]\[`E`\]\[`"toVertex"`\] *extends* `string` ? `S`\[`"edges"`\]\[`E`\]\[`"toVertex"`\] : `never` | [src/schema/utils.ts:85](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/utils.ts#L85) |
