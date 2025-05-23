# API Documentation Generation

This document explains how the ageSchemaClient library generates comprehensive API documentation using TypeDoc and integrates it with Docusaurus.

## Overview

The API documentation is automatically generated from TypeScript source code using:

- **TypeDoc** - Extracts documentation from TypeScript comments and type definitions
- **typedoc-plugin-markdown** - Converts TypeDoc output to Markdown format
- **docusaurus-plugin-typedoc** - Integrates TypeDoc with Docusaurus build process

## Configuration

### TypeDoc Configuration

The main TypeDoc configuration is in `typedoc.json`:

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["./src/index.ts"],
  "out": "./website/docs/api-generated",
  "plugin": ["typedoc-plugin-markdown"],
  "tsconfig": "./tsconfig.json",
  "readme": "none",
  "entryFileName": "index.md",
  "useCodeBlocks": true,
  "parametersFormat": "table",
  "interfacePropertiesFormat": "table",
  "classPropertiesFormat": "table",
  "enumMembersFormat": "table"
}
```

### Docusaurus Integration

The Docusaurus plugin configuration in `website/docusaurus.config.ts`:

```typescript
plugins: [
  [
    'docusaurus-plugin-typedoc',
    {
      entryPoints: ['../src/index.ts'],
      tsconfig: '../tsconfig.json',
      out: 'api-generated',
      sidebar: {
        categoryLabel: 'API Reference',
        position: 3,
        fullNames: true,
      },
      // ... additional options
    },
  ],
]
```

## Generated Documentation Structure

The API documentation is organized into the following categories:

### Classes
- **AgeSchemaClient** - Main client class
- **QueryBuilder** - Fluent query building interface
- **SchemaValidator** - Schema validation functionality
- **BatchOperations** - Batch data operations
- **Error Classes** - Comprehensive error handling

### Interfaces
- **ConnectionConfig** - Database connection configuration
- **SchemaDefinition** - Graph schema definitions
- **QueryResult** - Query execution results
- **ValidationOptions** - Schema validation options

### Type Aliases
- **QueryBuilderResult** - Query builder return types
- **VertexProperties** - Vertex property types
- **EdgeProperties** - Edge property types

### Enumerations
- **ErrorCode** - Error classification codes
- **PropertyType** - Schema property types
- **QueryPartType** - Query component types

## Documentation Standards

### JSDoc Comments

All public APIs should include comprehensive JSDoc comments:

```typescript
/**
 * Creates a new vertex in the graph database.
 * 
 * @param label - The vertex label
 * @param properties - The vertex properties
 * @returns Promise resolving to the created vertex
 * @throws {ValidationError} When properties don't match schema
 * @throws {ConnectionError} When database connection fails
 * 
 * @example
 * ```typescript
 * const vertex = await client.createVertex('Person', {
 *   name: 'Alice',
 *   age: 30
 * });
 * ```
 */
async createVertex(label: string, properties: Record<string, any>): Promise<Vertex> {
  // Implementation
}
```

### Supported JSDoc Tags

The documentation generation supports these JSDoc tags:

- `@param` - Parameter descriptions
- `@returns` - Return value description
- `@throws` - Exception documentation
- `@example` - Code examples
- `@see` - Cross-references
- `@since` - Version information
- `@deprecated` - Deprecation notices
- `@internal` - Internal APIs (excluded from docs)
- `@alpha` / `@beta` - API stability indicators

## Build Process

### Local Development

Generate API documentation locally:

```bash
# Generate API docs only
pnpm docs:api

# Generate and watch for changes
pnpm docs:api:watch

# Clean generated docs
pnpm docs:api:clean

# Generate API docs and build full documentation
pnpm docs:full
```

### CI/CD Integration

The GitHub Actions workflow automatically:

1. **Installs dependencies** - Both root and website dependencies
2. **Generates API documentation** - Runs TypeDoc with markdown plugin
3. **Builds Docusaurus site** - Includes generated API docs
4. **Deploys to GitHub Pages** - Automatic deployment on main branch
5. **Validates links** - Checks for broken links in pull requests

### Workflow Configuration

The documentation workflow (`.github/workflows/documentation.yml`) includes:

```yaml
- name: Generate API documentation
  run: pnpm docs:api

- name: Build documentation
  working-directory: ./website
  run: pnpm build
```

## Customization

### Output Formatting

Customize the generated documentation format:

```json
{
  "parametersFormat": "table",        // table | list | htmlTable
  "interfacePropertiesFormat": "table",
  "classPropertiesFormat": "table",
  "enumMembersFormat": "table",
  "useCodeBlocks": true,              // Wrap signatures in code blocks
  "expandObjects": false,             // Expand object types
  "hidePageTitle": false,             // Show/hide page titles
  "hidePageHeader": false             // Show/hide page headers
}
```

### Sidebar Integration

The generated documentation automatically integrates with Docusaurus sidebar:

```typescript
sidebar: {
  categoryLabel: 'API Reference',
  position: 3,
  fullNames: true,
}
```

### Source Links

Configure source code links:

```json
{
  "gitRevision": "main",
  "sourceLinkTemplate": "https://github.com/standardbeagle/ageSchemaClient/blob/{gitRevision}/{path}#L{line}"
}
```

## Troubleshooting

### Common Issues

**TypeDoc warnings about unknown tags**
- Add custom tags to `blockTags` or `inlineTags` in `typedoc.json`

**Missing references in documentation**
- Ensure all referenced types are exported from entry points
- Check `entryPoints` configuration in `typedoc.json`

**Build failures**
- Verify TypeScript compilation succeeds first
- Check for syntax errors in JSDoc comments
- Ensure all dependencies are installed

### Validation

The workflow includes link validation to catch:
- Broken internal links
- Missing referenced files
- Invalid markdown syntax

## Best Practices

1. **Write comprehensive JSDoc comments** for all public APIs
2. **Include practical examples** in documentation
3. **Use consistent terminology** across all documentation
4. **Keep examples up-to-date** with API changes
5. **Document error conditions** and exception handling
6. **Use semantic versioning** for API changes
7. **Mark deprecated APIs** with `@deprecated` tag
8. **Test documentation builds** before merging changes

## Integration with Main Documentation

The generated API documentation seamlessly integrates with the main Docusaurus site:

- **Navigation** - Appears in main sidebar under "API Reference"
- **Search** - Included in site-wide search functionality
- **Theming** - Uses consistent styling with main documentation
- **Cross-linking** - Can reference and be referenced by manual documentation

This ensures a unified documentation experience for users of the ageSchemaClient library.
