# Version Management Guidelines

This guide covers how to manage documentation versions, handle breaking changes, and maintain documentation consistency across different releases of Apache AGE Schema Client.

## Versioning Strategy

### Documentation Versioning Principles

1. **Follow semantic versioning**: Documentation versions align with library versions
2. **Maintain backward compatibility**: Preserve access to older documentation
3. **Clear migration paths**: Provide upgrade guides for breaking changes
4. **Consistent terminology**: Use version-specific language appropriately

### Version Types

#### Major Versions (X.0.0)
- **Breaking API changes**: Incompatible changes to public APIs
- **Architecture changes**: Significant structural modifications
- **Documentation restructuring**: Major organizational changes
- **Migration required**: Users must update their code

#### Minor Versions (X.Y.0)
- **New features**: Additional functionality without breaking changes
- **New documentation sections**: Additional guides or references
- **Enhanced examples**: Improved or additional code examples
- **Backward compatible**: Existing code continues to work

#### Patch Versions (X.Y.Z)
- **Bug fixes**: Corrections to existing functionality
- **Documentation fixes**: Typos, clarifications, broken links
- **Example updates**: Corrections to code examples
- **No API changes**: No changes to public interfaces

## Documentation Lifecycle

### Pre-Release Documentation

#### Alpha/Beta Releases

For pre-release versions:

1. **Mark as experimental**: Clearly label unstable features
2. **Include disclaimers**: Warn about potential changes
3. **Provide feedback channels**: Enable user input on new features
4. **Maintain separate sections**: Keep experimental docs separate

```markdown
> ⚠️ **Alpha Feature**: This feature is in alpha and may change significantly before the stable release. Use with caution in production environments.
```

#### Release Candidates

For release candidates:

1. **Finalize documentation**: Complete all documentation for new features
2. **Review for accuracy**: Ensure all examples work correctly
3. **Test migration guides**: Verify upgrade instructions are complete
4. **Prepare release notes**: Document all changes since last version

### Release Documentation

#### At Release Time

When releasing a new version:

1. **Update version numbers**: Throughout documentation and examples
2. **Finalize changelog**: Complete the changelog entry
3. **Publish release notes**: Highlight key changes and improvements
4. **Update getting started**: Ensure installation instructions are current
5. **Archive previous version**: Preserve access to older documentation

#### Post-Release

After release:

1. **Monitor feedback**: Watch for documentation issues or confusion
2. **Address gaps**: Fill in any missing documentation
3. **Update examples**: Ensure all examples use current best practices
4. **Plan next version**: Begin planning documentation for next release

### End-of-Life Documentation

#### Deprecation Process

When deprecating features:

1. **Mark as deprecated**: Add deprecation notices to relevant documentation
2. **Provide alternatives**: Show users what to use instead
3. **Set timeline**: Clearly communicate when features will be removed
4. **Update examples**: Replace deprecated patterns in examples

```markdown
> ⚠️ **Deprecated**: This method is deprecated as of v2.1.0 and will be removed in v3.0.0. Use [`newMethod()`](./new-method.md) instead.
```

#### Version Archival

For end-of-life versions:

1. **Archive documentation**: Move to archived section
2. **Add notices**: Indicate the version is no longer supported
3. **Provide migration path**: Link to upgrade documentation
4. **Maintain critical fixes**: Continue to fix security-related documentation

## Breaking Changes Management

### Identifying Breaking Changes

Breaking changes include:

- **API signature changes**: Modified function parameters or return types
- **Removed functionality**: Deleted methods, classes, or features
- **Behavioral changes**: Different behavior for same inputs
- **Configuration changes**: Modified configuration options or defaults
- **Dependency changes**: Updated minimum requirements

### Documenting Breaking Changes

#### Migration Guides

Create comprehensive migration guides for major versions:

```markdown
# Migration Guide: v1.x to v2.0

This guide helps you upgrade from Apache AGE Schema Client v1.x to v2.0.

## Breaking Changes

### 1. Connection Management

**v1.x (Old)**:
```typescript
const client = new AgeClient({
  host: 'localhost',
  port: 5432
});
```

**v2.0 (New)**:
```typescript
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres'
});
```

**Migration Steps**:
1. Replace `AgeClient` with `PgConnectionManager`
2. Add required `database` parameter
3. Update connection handling code

### 2. Query Execution

**v1.x (Old)**:
```typescript
const result = await client.query(cypherQuery);
```

**v2.0 (New)**:
```typescript
const connection = await connectionManager.getConnection();
const queryExecutor = new QueryExecutor(connection);
const result = await queryExecutor.executeCypher(cypherQuery, {}, graphName);
connection.release();
```

**Migration Steps**:
1. Obtain connection from connection manager
2. Create QueryExecutor instance
3. Use executeCypher method with graph name
4. Release connection when done
```

#### Changelog Format

Use consistent changelog format:

```markdown
## [2.0.0] - 2024-01-15

### Breaking Changes
- **Connection Management**: Replaced `AgeClient` with `PgConnectionManager` for better connection pooling
- **Query Execution**: Modified query execution API to require explicit graph name parameter
- **Schema Validation**: Changed validation error format to include field-level details

### Added
- New `BatchLoader` class for efficient bulk data operations
- Support for transaction management with automatic rollback
- Enhanced error handling with specific error types

### Changed
- Improved performance for large dataset operations
- Updated TypeScript definitions for better type safety
- Enhanced documentation with more examples

### Deprecated
- `legacyMethod()` - Use `newMethod()` instead (will be removed in v3.0.0)

### Removed
- Support for Node.js versions below 16
- Deprecated `oldUtilityFunction()` (use `newUtilityFunction()` instead)

### Fixed
- Connection pool exhaustion under high load
- Memory leaks in batch operations
- Incorrect error messages for validation failures

### Security
- Updated dependencies to address security vulnerabilities
- Improved parameter sanitization to prevent injection attacks
```

## Version-Specific Documentation

### Maintaining Multiple Versions

#### Documentation Structure

```
docs/
├── current/                    # Latest stable version
├── v2.0/                      # Version 2.0 documentation
├── v1.x/                      # Version 1.x documentation (archived)
└── migration/                 # Migration guides between versions
    ├── v1-to-v2.md
    └── v2-to-v3.md
```

#### Version Switching

Implement version switching in documentation:

```typescript
// In docusaurus.config.ts
const config: Config = {
  // ... other config
  
  presets: [
    [
      'classic',
      {
        docs: {
          versions: {
            current: {
              label: '2.0.x',
              path: 'current',
            },
            '1.0': {
              label: '1.0.x',
              path: '1.0',
              banner: 'unmaintained',
            },
          },
        },
      },
    ],
  ],
};
```

### Version-Specific Content

#### Conditional Content

Use version-specific content blocks:

```markdown
<!-- For version 2.0+ -->
:::info Version 2.0+
This feature is available starting from version 2.0.
:::

<!-- For deprecated features -->
:::warning Deprecated in 2.1
This feature is deprecated and will be removed in version 3.0.
:::

<!-- For version-specific examples -->
<Tabs>
  <TabItem value="v2" label="Version 2.0+" default>
    ```typescript
    // Version 2.0+ syntax
    const result = await newMethod();
    ```
  </TabItem>
  <TabItem value="v1" label="Version 1.x">
    ```typescript
    // Version 1.x syntax (deprecated)
    const result = await oldMethod();
    ```
  </TabItem>
</Tabs>
```

#### Version Badges

Use badges to indicate version requirements:

```markdown
# Feature Name ![Version](https://img.shields.io/badge/version-2.0%2B-blue)

This feature requires Apache AGE Schema Client version 2.0 or higher.
```

## Release Process Integration

### Documentation in Release Workflow

#### Pre-Release Checklist

Before each release:

- [ ] **Update version numbers**: In all documentation and examples
- [ ] **Review breaking changes**: Ensure all breaking changes are documented
- [ ] **Test migration guides**: Verify upgrade instructions work
- [ ] **Update API documentation**: Regenerate TypeDoc documentation
- [ ] **Review examples**: Ensure all code examples work with new version
- [ ] **Update changelog**: Complete changelog entry for the release
- [ ] **Prepare release notes**: Highlight key changes for users

#### Release Documentation Tasks

During release:

1. **Tag documentation**: Create git tag for documentation version
2. **Deploy documentation**: Update live documentation site
3. **Archive previous version**: Move previous docs to archived section
4. **Update navigation**: Ensure version switcher works correctly
5. **Announce changes**: Communicate documentation updates

#### Post-Release Tasks

After release:

1. **Monitor feedback**: Watch for documentation issues
2. **Address gaps**: Fill in any missing documentation
3. **Update external references**: Update links in other projects
4. **Plan next version**: Begin planning for next release

### Automation

#### Automated Version Updates

Use scripts to automate version updates:

```bash
#!/bin/bash
# update-version.sh

NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
  echo "Usage: $0 <new-version>"
  exit 1
fi

# Update package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update documentation references
find docs -name "*.md" -exec sed -i "s/version [0-9]\+\.[0-9]\+\.[0-9]\+/version $NEW_VERSION/g" {} \;

# Update examples
find examples -name "*.ts" -exec sed -i "s/age-schema-client@[0-9]\+\.[0-9]\+\.[0-9]\+/age-schema-client@$NEW_VERSION/g" {} \;

echo "Updated version to $NEW_VERSION"
```

#### CI/CD Integration

Integrate version management with CI/CD:

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Extract version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
      
      - name: Update documentation
        run: |
          ./scripts/update-version.sh ${{ steps.version.outputs.VERSION }}
          
      - name: Generate API docs
        run: pnpm docs:api
        
      - name: Build documentation
        run: pnpm docs:build
        
      - name: Deploy documentation
        run: pnpm docs:deploy
```

## Best Practices

### Version Communication

#### Clear Version Requirements

Always specify version requirements:

```markdown
## Installation

### Requirements

- Node.js 16 or higher
- Apache AGE Schema Client 2.0 or higher
- PostgreSQL 12+ with Apache AGE extension

### Install

```bash
npm install age-schema-client@^2.0.0
```
```

#### Compatibility Matrices

Provide compatibility information:

| Library Version | Node.js | PostgreSQL | Apache AGE |
|----------------|---------|------------|------------|
| 2.0.x          | 16+     | 12+        | 1.3+       |
| 1.x            | 14+     | 11+        | 1.1+       |

### Documentation Quality

#### Version-Specific Testing

Test documentation for each supported version:

```bash
# Test examples with different versions
npm install age-schema-client@2.0.0
npm test

npm install age-schema-client@1.9.0
npm test
```

#### Consistent Terminology

Use version-appropriate terminology:

- **Current version**: Use present tense ("The library provides...")
- **Future versions**: Use future tense ("Version 3.0 will include...")
- **Past versions**: Use past tense ("Version 1.x included...")

### User Experience

#### Smooth Transitions

Help users transition between versions:

1. **Provide migration tools**: Scripts or utilities to help upgrade
2. **Offer side-by-side comparisons**: Show old vs new approaches
3. **Maintain examples**: Keep working examples for each version
4. **Support multiple versions**: Provide help for users on older versions

#### Clear Communication

Communicate version changes effectively:

1. **Use clear headings**: Make version information scannable
2. **Highlight breaking changes**: Make them impossible to miss
3. **Provide context**: Explain why changes were made
4. **Offer alternatives**: Always show what to use instead

This version management guide ensures that documentation remains useful and accessible across all versions of the Apache AGE Schema Client library.
