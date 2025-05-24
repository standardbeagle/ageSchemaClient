[**age-schema-client v0.3.0**](../index.md)

***

[age-schema-client](/ageSchemaClient/api-generated/index.md) / OrderByPart

# Class: OrderByPart

Defined in: [src/query/parts.ts:235](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L235)

ORDER BY query part

## Extends

- [`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md)

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

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`constructor`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#constructor)

## Properties

| Property | Type | Default value | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | [`QueryPartType`](/ageSchemaClient/api-generated/enumerations/QueryPartType.md) | `QueryPartType.ORDER_BY` | Query part type | [`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`type`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#type) | [src/query/parts.ts:239](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/query/parts.ts#L239) |

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

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`getParameters`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#getparameters)

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
| `direction` | [`OrderDirection`](/ageSchemaClient/api-generated/enumerations/OrderDirection.md) | `OrderDirection.ASC` | Order direction |

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

[`BaseQueryPart`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md).[`toCypher`](/ageSchemaClient/api-generated/classes/BaseQueryPart.md#tocypher)
