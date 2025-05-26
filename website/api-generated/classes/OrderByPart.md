[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / OrderByPart

# Class: OrderByPart

Defined in: [src/query/parts.ts:235](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L235)

ORDER BY query part

## Extends

- [`BaseQueryPart`](BaseQueryPart.md)

## Constructors

### Constructor

```ts
new OrderByPart(items): OrderByPart;
```

Defined in: [src/query/parts.ts:254](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L254)

Create a new ORDER BY part

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `items` | `object`[] | `[]` | Order by items |

#### Returns

`OrderByPart`

#### Overrides

[`BaseQueryPart`](BaseQueryPart.md).[`constructor`](BaseQueryPart.md#constructor)

## Properties

| Property | Type | Default value | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`QueryPartType`](../enumerations/QueryPartType.md) | `QueryPartType.ORDER_BY` | Query part type | [`BaseQueryPart`](BaseQueryPart.md).[`type`](BaseQueryPart.md#type) | [src/query/parts.ts:239](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L239) |

## Methods

### getParameters()

```ts
getParameters(): Record<string, any>;
```

Defined in: [src/query/parts.ts:35](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L35)

Get parameters used in this query part

#### Returns

`Record`\<`string`, `any`\>

#### Inherited from

[`BaseQueryPart`](BaseQueryPart.md).[`getParameters`](BaseQueryPart.md#getparameters)

***

### addItem()

```ts
addItem(expression, direction): void;
```

Defined in: [src/query/parts.ts:268](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L268)

Add an order by item

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `expression` | `string` | `undefined` | Expression |
| `direction` | [`OrderDirection`](../enumerations/OrderDirection.md) | `OrderDirection.ASC` | Order direction |

#### Returns

`void`

***

### toCypher()

```ts
toCypher(): string;
```

Defined in: [src/query/parts.ts:275](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L275)

Convert to Cypher string

#### Returns

`string`

#### Overrides

[`BaseQueryPart`](BaseQueryPart.md).[`toCypher`](BaseQueryPart.md#tocypher)
