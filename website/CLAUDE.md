# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm start` - Start local development server (port 3000)
- `pnpm build` - Build static documentation site
- `pnpm serve` - Serve the built site locally
- `pnpm typecheck` - Run TypeScript type checking

### API Documentation Generation
From the parent directory:
- `pnpm docs:api` - Generate TypeDoc API documentation
- `pnpm docs:api:watch` - Watch mode for API doc generation
- `pnpm docs:full` - Generate API docs and build site

### Deployment
- `pnpm deploy` - Deploy to GitHub Pages (requires permissions)
- Automatic deployment via GitHub Actions on main branch

### Testing Commands (Parent Project)
- `pnpm test` - Run all tests
- `pnpm test:unit` - Run unit tests only
- `pnpm test:integration` - Run integration tests
- `pnpm lint` - Run ESLint

## Architecture

This is a Docusaurus 3.7.0 documentation website for the ageSchemaClient TypeScript library.

### Key Components

1. **Documentation Structure** (`/docs/`)
   - `intro.md` - Homepage content
   - `getting-started/` - Installation and setup guides
   - `api-reference/` - Manual API documentation
   - `api-generated/` - Auto-generated TypeDoc documentation
   - `how-to-guides/` - Practical implementation guides
   - `architecture/` - System design documentation
   - `patterns/` - Common relationship patterns

2. **TypeDoc Integration**
   - Configured via `typedoc.json` in parent directory
   - Uses `docusaurus-plugin-typedoc` for integration
   - Generates markdown files in `docs/api-generated/` and `api-generated/`
   - Automatically updates sidebar navigation

3. **Search Integration**
   - Algolia DocSearch configured for full-text search
   - Configuration in `themeConfig.algolia` section

4. **Custom Components** (`/src/components/`)
   - `HomepageFeatures/` - Feature cards on homepage
   - `Logo/` - Custom logo component

5. **CI/CD Pipeline**
   - GitHub Actions workflow at `.github/workflows/documentation.yml`
   - Automatic builds on PR for validation
   - Automatic deployment to GitHub Pages on main branch
   - Link checking to prevent broken documentation

### Important Configuration

- **Base URL**: `/ageSchemaClient/` (for GitHub Pages)
- **Organization**: `standardbeagle`
- **Project**: `ageSchemaClient`
- **Broken Links**: Set to 'ignore' (due to TypeDoc generation timing)

### Working with Documentation

When modifying documentation:
1. Edit markdown files in `/docs/` directory
2. Use relative links for internal navigation
3. Include front matter with title and description
4. Code blocks should specify language for syntax highlighting
5. API documentation in `api-generated/` is auto-generated - do not edit directly

When adding new documentation sections:
1. Create markdown files in appropriate subdirectory
2. Update `sidebars.ts` if manual sidebar configuration needed
3. Include `_category_.json` for directory metadata