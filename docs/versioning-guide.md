# Documentation Versioning Guide

This guide explains how to manage documentation versions for the ageSchemaClient library using Docusaurus versioning.

## Overview

The ageSchemaClient documentation uses Docusaurus versioning to maintain documentation for multiple versions of the library. This allows users to access documentation that matches their installed version of the library.

## Current Versioning Setup

- **Current Version**: The `docs/` folder contains the latest development documentation (labeled as "Next")
- **Latest Stable Version**: Version 0.3.0 (served at the root `/docs/` path)
- **Version Storage**: Versioned docs are stored in `website/versioned_docs/version-X.X.X/`
- **Sidebar Storage**: Versioned sidebars are stored in `website/versioned_sidebars/version-X.X.X-sidebars.json`

## Creating a New Documentation Version

### When to Create a New Version

Create a new documentation version when:
- Releasing a new major version of the library
- Releasing a minor version with significant API changes
- Making breaking changes that affect the documentation

**Note**: Don't create versions for patch releases unless there are documentation changes.

### Steps to Create a New Version

1. **Ensure Current Documentation is Ready**
   ```bash
   # Review and finalize all documentation in the docs/ folder
   # Make sure all examples work with the new version
   ```

2. **Create the New Version**
   ```bash
   # From the root directory
   pnpm docs:version X.X.X
   
   # Or from the website directory
   cd website
   pnpm docs:version X.X.X
   ```

3. **Update Version Configuration** (if needed)
   Edit `website/docusaurus.config.ts` to update version labels or paths:
   ```typescript
   versions: {
     current: {
       label: 'Next',
       path: 'next',
       banner: 'unreleased',
     },
     'X.X.X': {
       label: 'X.X.X',
       path: '',
       banner: 'none',
     },
     // ... other versions
   },
   ```

4. **Test the New Version**
   ```bash
   pnpm docs:start
   ```
   Verify that:
   - Version dropdown appears in the navbar
   - All versions are accessible
   - Links work correctly between versions
   - API documentation is generated correctly

## Version Management Commands

### Available Scripts

```bash
# Create a new documentation version
pnpm docs:version X.X.X

# List all available versions
pnpm docs:version:list

# Start development server
pnpm docs:start

# Build documentation
pnpm docs:build

# Clear Docusaurus cache
pnpm docs:clear
```

### From Website Directory

```bash
cd website

# Create a new version
pnpm docs:version X.X.X

# List versions
pnpm docs:version:list
```

## Version Configuration Options

In `website/docusaurus.config.ts`, you can configure:

### Version Labels
```typescript
versions: {
  'X.X.X': {
    label: 'X.X.X (Stable)',  // Custom label in dropdown
  },
}
```

### Version Paths
```typescript
versions: {
  'X.X.X': {
    path: 'stable',  // Serves at /docs/stable/
  },
}
```

### Version Banners
```typescript
versions: {
  'X.X.X': {
    banner: 'unmaintained',  // Shows banner for old versions
  },
}
```

Banner options:
- `'none'`: No banner
- `'unreleased'`: For development versions
- `'unmaintained'`: For old versions no longer supported

## File Structure

```
website/
├── docs/                           # Current/Next version docs
├── versioned_docs/
│   ├── version-0.3.0/             # Version 0.3.0 docs
│   └── version-X.X.X/             # Future versions
├── versioned_sidebars/
│   ├── version-0.3.0-sidebars.json
│   └── version-X.X.X-sidebars.json
├── versions.json                   # List of all versions
└── docusaurus.config.ts           # Configuration
```

## Best Practices

### 1. Keep Version Count Manageable
- Maintain 3-5 active versions maximum
- Archive very old versions to external links
- Remove unmaintained versions regularly

### 2. Version Naming
- Use semantic versioning (X.X.X)
- Match library version numbers exactly
- Use consistent naming across all versions

### 3. Content Management
- Use absolute imports (`@site/...`) instead of relative paths
- Link to docs using file paths with `.md` extension
- Place version-specific assets in the versioned docs folder
- Place shared assets in `/static/`

### 4. API Documentation
- API docs are automatically versioned with TypeDoc
- Ensure TypeDoc configuration matches the library version
- Test API doc generation after creating new versions

## Troubleshooting

### Version Not Appearing in Dropdown
1. Check `versions.json` contains the version
2. Verify version configuration in `docusaurus.config.ts`
3. Clear cache: `pnpm docs:clear`
4. Restart development server

### Broken Links Between Versions
1. Use file-based links: `[text](../path/file.md)`
2. Avoid hardcoded URLs
3. Use `@site/` for absolute imports

### Build Errors
1. Check all versioned docs have valid frontmatter
2. Verify sidebar configurations are valid JSON
3. Ensure all referenced files exist in versioned folders

## Deployment Considerations

### GitHub Pages
- All versions are built and deployed together
- Configure `baseUrl` correctly in `docusaurus.config.ts`
- Ensure GitHub Actions have access to all version files

### Performance
- Limit number of active versions to improve build time
- Use `onlyIncludeVersions` in development for faster builds
- Consider archiving old versions to external sites

## Example Workflow

### Releasing Version 0.4.0

1. **Prepare Documentation**
   ```bash
   # Update docs/ folder with 0.4.0 changes
   # Update API examples
   # Test all documentation locally
   ```

2. **Create Version**
   ```bash
   pnpm docs:version 0.4.0
   ```

3. **Update Configuration**
   ```typescript
   // In docusaurus.config.ts
   lastVersion: '0.4.0',
   versions: {
     current: {
       label: 'Next',
       path: 'next',
       banner: 'unreleased',
     },
     '0.4.0': {
       label: '0.4.0',
       path: '',
       banner: 'none',
     },
     '0.3.0': {
       label: '0.3.0',
       path: '0.3.0',
       banner: 'none',
     },
   },
   ```

4. **Test and Deploy**
   ```bash
   pnpm docs:build
   pnpm docs:deploy
   ```

## Maintenance

### Regular Tasks
- Review and update version banners
- Archive very old versions
- Update version labels as needed
- Monitor build performance

### When to Archive Versions
- Version is more than 2 major versions old
- Version has critical security issues
- Version is no longer supported

This versioning system ensures users always have access to documentation that matches their library version while keeping maintenance overhead manageable.
