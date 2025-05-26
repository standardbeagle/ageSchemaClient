[**age-schema-client v0.4.0**](../index.md)

***

[age-schema-client](../index.md) / PropertyTypeOf

# Type Alias: PropertyTypeOf\<P\>

```ts
type PropertyTypeOf<P> = P["type"] extends STRING ? string : P["type"] extends NUMBER ? number : P["type"] extends INTEGER ? number : P["type"] extends BOOLEAN ? boolean : P["type"] extends DATE ? Date : P["type"] extends DATETIME ? Date : P["type"] extends OBJECT ? Record<string, unknown> : P["type"] extends ARRAY ? unknown[] : P["type"] extends ANY ? unknown : ...[...] extends ...[] ? ... extends ... ? ... : ... : unknown;
```

Defined in: [src/schema/utils.ts:43](https://github.com/standardbeagle/ageSchemaClient/blob/main/src/schema/utils.ts#L43)

Extract property type from a property definition

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `P` *extends* [`PropertyDefinition`](../interfaces/PropertyDefinition.md) | Property definition |
