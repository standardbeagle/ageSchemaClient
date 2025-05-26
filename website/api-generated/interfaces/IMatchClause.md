[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / IMatchClause

# Interface: IMatchClause\<T, L\>

Defined in: [src/query/types.ts:321](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L321)

Match clause interface

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SchemaDefinition`](SchemaDefinition.md) |
| `L` *extends* keyof `T`\[`"vertices"`\] |

## Methods

### constraint()

```ts
constraint(properties): this;
```

Defined in: [src/query/types.ts:333](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L333)

Add property constraints to the vertex pattern

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | `Record`\<`string`, `any`\> | Object with property-value pairs |

#### Returns

`this`

This match clause

#### Throws

Error if any property value is null, undefined, or NaN

***

### where()

```ts
where(condition, params?): this;
```

Defined in: [src/query/types.ts:342](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L342)

Add WHERE clause

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | `string` | Condition expression |
| `params?` | `Record`\<`string`, `any`\> | Parameters |

#### Returns

`this`

This match clause

***

### outgoing()

```ts
outgoing<E>(
   label, 
   alias, 
   targetLabel, 
   targetAlias): this;
```

Defined in: [src/query/types.ts:347](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L347)

Add outgoing edge

#### Type Parameters

| Type Parameter |
| ------ |
| `E` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `label` | `E` |
| `alias` | `string` |
| `targetLabel` | keyof `T`\[`"vertices"`\] |
| `targetAlias` | `string` |

#### Returns

`this`

***

### incoming()

```ts
incoming<E>(
   label, 
   alias, 
   sourceLabel, 
   sourceAlias): this;
```

Defined in: [src/query/types.ts:357](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L357)

Add incoming edge

#### Type Parameters

| Type Parameter |
| ------ |
| `E` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `label` | `E` |
| `alias` | `string` |
| `sourceLabel` | keyof `T`\[`"vertices"`\] |
| `sourceAlias` | `string` |

#### Returns

`this`

***

### related()

```ts
related<E>(
   label, 
   alias, 
   otherLabel, 
   otherAlias): this;
```

Defined in: [src/query/types.ts:367](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L367)

Add bidirectional edge

#### Type Parameters

| Type Parameter |
| ------ |
| `E` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `label` | `E` |
| `alias` | `string` |
| `otherLabel` | keyof `T`\[`"vertices"`\] |
| `otherAlias` | `string` |

#### Returns

`this`

***

### done()

```ts
done(): IQueryBuilder<T>;
```

Defined in: [src/query/types.ts:377](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/types.ts#L377)

Return to the main query builder

#### Returns

[`IQueryBuilder`](IQueryBuilder.md)\<`T`\>
