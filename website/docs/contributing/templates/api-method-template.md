---
title: API Method Documentation Template
description: Template for documenting API methods
---

# API Method Documentation Template

Use this template when documenting API methods that supplement the auto-generated TypeDoc documentation.

---

## [Method Name]

Brief description of what this method does and when to use it.

### Syntax

```typescript
methodName<T extends GenericType>(
  parameter1: Type1,
  parameter2: Type2,
  options?: OptionsType
): Promise<ReturnType<T>>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parameter1` | `Type1` | Yes | Description of the first parameter |
| `parameter2` | `Type2` | Yes | Description of the second parameter |
| `options` | `OptionsType` | No | Optional configuration object |

#### Options Object

If the method accepts an options object, document its properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `timeout` | `number` | `5000` | Request timeout in milliseconds |
| `retries` | `number` | `3` | Number of retry attempts |
| `validate` | `boolean` | `true` | Whether to validate input data |

### Returns

**Type**: `Promise<ReturnType<T>>`

Description of what the method returns, including:
- The structure of the returned data
- When the promise resolves/rejects
- Any special properties or methods on the returned object

### Throws

List the exceptions this method can throw:

- **`ValidationError`**: When input data doesn't match the schema
- **`ConnectionError`**: When database connection fails
- **`TimeoutError`**: When the operation times out

### Examples

#### Basic Usage

```typescript
import { MethodClass } from 'age-schema-client';

// Setup (if needed)
const instance = new MethodClass(configuration);

// Basic method call
const result = await instance.methodName(
  'parameter1Value',
  { property: 'value' }
);

console.log('Result:', result);
```

#### Advanced Usage

```typescript
// Advanced example with options
const result = await instance.methodName(
  'parameter1Value',
  { property: 'value' },
  {
    timeout: 10000,
    retries: 5,
    validate: false
  }
);

// Handle the result
if (result.success) {
  console.log('Operation completed:', result.data);
} else {
  console.error('Operation failed:', result.error);
}
```

#### Error Handling

```typescript
try {
  const result = await instance.methodName(
    'parameter1Value',
    { property: 'value' }
  );

  // Process successful result
  console.log('Success:', result);

} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Invalid fields:', error.fields);
  } else if (error instanceof ConnectionError) {
    console.error('Database connection failed:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Usage Notes

#### When to Use

- Describe the primary use cases for this method
- Explain when this method is preferred over alternatives
- Mention any prerequisites or setup requirements

#### Performance Considerations

- Note any performance implications
- Suggest optimization strategies if applicable
- Mention batch alternatives for bulk operations

#### Best Practices

- Recommended patterns for using this method
- Common mistakes to avoid
- Integration tips with other library features

### Related Methods

- [`relatedMethod1()`](./related-method-1.md) - Brief description of relationship
- [`relatedMethod2()`](./related-method-2.md) - Brief description of relationship
- [`alternativeMethod()`](./alternative-method.md) - Alternative approach for similar functionality

### See Also

- [Related Guide](../guides/related-guide.md) - Comprehensive guide covering this method
- [Troubleshooting](../troubleshooting/method-issues.md) - Common issues and solutions
- [Examples](../../examples/method-examples.md) - More detailed examples

---

## Template Usage Instructions

### When to Use This Template

Use this template for:
- Complex methods that need more explanation than TypeDoc provides
- Methods with multiple usage patterns
- Methods that require detailed error handling documentation
- Methods that have important performance or security considerations

### Customization Guidelines

1. **Replace placeholders**: Update all `[Method Name]`, `Type1`, etc. with actual values
2. **Adjust sections**: Remove sections that don't apply to your method
3. **Add sections**: Include additional sections if needed (e.g., Security, Migration)
4. **Update examples**: Provide realistic, working examples
5. **Test examples**: Ensure all code examples actually work

### Integration with TypeDoc

This manual documentation should:
- **Complement** the auto-generated TypeDoc documentation
- **Not duplicate** basic information already in TypeDoc
- **Focus on** usage patterns, examples, and complex scenarios
- **Link to** the TypeDoc page for complete API reference

### Maintenance

- **Update** when the method signature changes
- **Review** examples when dependencies are updated
- **Check** links when documentation is reorganized
- **Validate** that examples still work with each release
