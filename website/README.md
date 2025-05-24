# ageSchemaClient Documentation

This directory contains the Docusaurus-based documentation website for ageSchemaClient.

## Development

### Prerequisites

- Node.js 18+
- pnpm 10+

### Local Development

```bash
# From project root
pnpm docs:start

# Or from website directory
cd website
pnpm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```bash
# From project root
pnpm docs:build

# Or from website directory
cd website
pnpm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

The documentation is automatically deployed to GitHub Pages when changes are pushed to the main branch. The deployment is handled by the GitHub Actions workflow at `.github/workflows/documentation.yml`.

## Structure

```
website/
├── docs/                    # Documentation content
│   ├── intro.md            # Homepage
│   ├── getting-started/    # Installation and setup guides
│   ├── api-reference/      # API documentation
│   ├── how-to-guides/      # Practical guides
│   └── architecture/       # Architecture documentation
├── blog/                   # Blog posts (optional)
├── src/                    # Custom React components
├── static/                 # Static assets
├── docusaurus.config.ts    # Site configuration
└── sidebars.ts            # Sidebar navigation
```

## Configuration

### Site Metadata

The site is configured for the ageSchemaClient library with:

- **Title**: ageSchemaClient Documentation
- **Tagline**: Comprehensive API documentation for Apache AGE graph databases
- **URL**: https://standardbeagle.github.io
- **Base URL**: /ageSchemaClient/

### Navigation

The sidebar navigation is organized into:

1. **Getting Started** - Installation, basic usage, configuration
2. **API Reference** - Complete API documentation
3. **How-To Guides** - Practical examples and patterns
4. **Architecture** - Design and implementation details

## GitHub Actions CI/CD

The documentation uses GitHub Actions for continuous integration and deployment:

### Workflow Features

- **Automatic builds** on pushes to main branch
- **Pull request validation** with link checking
- **GitHub Pages deployment** for the main branch
- **Link validation** to catch broken links
- **Caching** for faster builds

### Workflow Triggers

- Push to main branch (deploys to GitHub Pages)
- Pull requests (builds and validates links)
- Changes to documentation files or workflow configuration

### Manual Deployment

If needed, you can manually deploy using:

```bash
# From website directory
pnpm deploy
```

This builds the site and pushes to the `gh-pages` branch.

## Writing Documentation

### Markdown Files

Documentation is written in Markdown with MDX support for React components.

### Front Matter

Each documentation page should include front matter:

```markdown
---
title: Page Title
description: Page description for SEO
---

# Page Content
```

### Code Examples

Use syntax highlighting for code blocks:

````markdown
```typescript
import { AgeSchemaClient } from 'age-schema-client';

const client = new AgeSchemaClient({
  host: 'localhost',
  port: 5432,
  database: 'your_database'
});
```
````

### Internal Links

Use relative links for internal navigation:

```markdown
[Getting Started](./getting-started/installation)
[API Reference](../api-reference/client)
```

## Troubleshooting

### Build Failures

1. **Broken Links**: Check the build output for broken link errors
2. **Missing Files**: Ensure all referenced files exist
3. **Syntax Errors**: Validate Markdown and MDX syntax

### Local Development Issues

1. **Port Conflicts**: Use `--port` flag to specify different port
2. **Cache Issues**: Clear Docusaurus cache with `pnpm clear`
3. **Dependency Issues**: Delete `node_modules` and reinstall

## Contributing

1. Make changes to documentation files
2. Test locally with `pnpm docs:start`
3. Build to verify with `pnpm docs:build`
4. Submit pull request
5. GitHub Actions will validate the changes

The documentation will be automatically deployed when the pull request is merged to main.
