# Build and Deployment Process

This guide covers the complete build and deployment process for Apache AGE Schema Client documentation, including local development, testing, and production deployment.

## Overview

The documentation system consists of:

- **Source documentation**: Markdown files in `docs/` directory
- **TypeDoc API documentation**: Auto-generated from TypeScript source code
- **Docusaurus website**: Static site generator for the final documentation
- **GitHub Pages**: Hosting platform for the deployed documentation

## Local Development Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js**: Version 18 or higher
- **pnpm**: Package manager (recommended) or npm
- **Git**: For version control

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/standardbeagle/ageSchemaClient.git
   cd ageSchemaClient
   ```

2. **Install dependencies**:
   ```bash
   # Install main project dependencies
   pnpm install
   
   # Install website dependencies
   cd website
   pnpm install
   cd ..
   ```

3. **Verify setup**:
   ```bash
   # Test that documentation builds
   pnpm docs:build
   ```

### Development Workflow

#### Starting the Development Server

```bash
# Start the documentation development server
pnpm docs:start

# Alternative: Start from website directory
cd website
pnpm start
```

This will:
- Start Docusaurus development server on `http://localhost:3000`
- Enable hot reloading for markdown changes
- Provide live preview of your documentation changes

#### Working with API Documentation

The API documentation is generated from TypeScript source code using TypeDoc:

```bash
# Generate API documentation
pnpm docs:api

# Generate and watch for changes (useful during development)
pnpm docs:api:watch

# Clean generated API documentation
pnpm docs:api:clean
```

#### Full Documentation Build

To test the complete build process locally:

```bash
# Generate API docs and build the complete site
pnpm docs:full

# Alternative: Step by step
pnpm docs:api
pnpm docs:build
```

### File Structure

Understanding the documentation file structure:

```
project-root/
├── docs/                          # Source documentation
│   ├── README.md                  # Main documentation entry
│   ├── contributing/              # This directory
│   ├── architecture/              # Architecture documentation
│   └── [feature-docs].md          # Feature-specific documentation
│
├── website/                       # Docusaurus website
│   ├── docs/                      # Docusaurus documentation source
│   │   ├── intro.md              # Homepage content
│   │   ├── api-generated/        # Auto-generated TypeDoc docs
│   │   ├── getting-started/      # Getting started guides
│   │   ├── how-to-guides/        # How-to guides
│   │   ├── architecture/         # Architecture docs (copied)
│   │   └── patterns/             # Relationship patterns
│   │
│   ├── blog/                     # Blog posts
│   ├── src/                      # Custom React components
│   ├── static/                   # Static assets
│   ├── docusaurus.config.ts      # Docusaurus configuration
│   └── sidebars.ts               # Sidebar configuration
│
├── typedoc.json                  # TypeDoc configuration
└── package.json                  # Build scripts
```

## Build Process Details

### TypeDoc Generation

TypeDoc extracts documentation from TypeScript source code:

**Configuration** (`typedoc.json`):
- **Entry point**: `./src/index.ts`
- **Output**: `./website/docs/api-generated`
- **Plugin**: `typedoc-plugin-markdown` for Markdown output
- **Integration**: Configured to work with Docusaurus

**Build command**:
```bash
pnpm docs:api
```

**What it does**:
1. Analyzes TypeScript source code in `src/`
2. Extracts JSDoc comments and type information
3. Generates Markdown files in `website/docs/api-generated/`
4. Creates sidebar configuration for Docusaurus

### Docusaurus Build

Docusaurus builds the final static website:

**Configuration** (`website/docusaurus.config.ts`):
- **Base URL**: `/ageSchemaClient/` (for GitHub Pages)
- **Organization**: `standardbeagle`
- **Repository**: `ageSchemaClient`
- **Plugins**: TypeDoc integration, search, etc.

**Build command**:
```bash
cd website
pnpm build
```

**What it does**:
1. Processes all Markdown files in `website/docs/`
2. Applies Docusaurus theme and navigation
3. Generates static HTML, CSS, and JavaScript
4. Optimizes for production (minification, etc.)
5. Outputs to `website/build/`

### Complete Build Pipeline

The full build process:

```bash
# 1. Generate API documentation from TypeScript
pnpm docs:api

# 2. Build the Docusaurus website
cd website
pnpm build

# 3. Serve locally for testing (optional)
pnpm serve
```

Or use the combined command:
```bash
pnpm docs:full
```

## Testing Documentation

### Local Testing

#### Development Server Testing

```bash
# Start development server
pnpm docs:start

# Test in browser
open http://localhost:3000
```

**What to test**:
- Navigation works correctly
- All links are functional
- Code examples display properly
- Search functionality works
- Mobile responsiveness

#### Production Build Testing

```bash
# Build for production
pnpm docs:build

# Serve production build locally
cd website
pnpm serve

# Test production build
open http://localhost:3000
```

**What to test**:
- Build completes without errors
- All pages load correctly
- Performance is acceptable
- No broken links or missing assets

### Automated Testing

#### Link Checking

```bash
# Install link checker (if not already installed)
npm install -g markdown-link-check

# Check all markdown files
find docs -name "*.md" -exec markdown-link-check {} \;

# Check specific file
markdown-link-check docs/README.md
```

#### Build Validation

```bash
# Validate that build succeeds
pnpm docs:build

# Check for build warnings
pnpm docs:build 2>&1 | grep -i warning
```

#### Content Validation

```bash
# Spell checking (requires aspell or similar)
find docs -name "*.md" -exec aspell check {} \;

# Markdown linting (requires markdownlint-cli)
markdownlint docs/**/*.md
```

## Deployment

### GitHub Pages Deployment

The documentation is automatically deployed to GitHub Pages using GitHub Actions.

#### Automatic Deployment

**Trigger**: Push to `main` branch

**Process**:
1. GitHub Actions workflow runs
2. Installs dependencies
3. Generates API documentation
4. Builds Docusaurus site
5. Deploys to GitHub Pages

**Configuration** (`.github/workflows/docs.yml`):
```yaml
name: Deploy Documentation

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: |
          pnpm install
          cd website && pnpm install
      
      - name: Generate API docs
        run: pnpm docs:api
      
      - name: Build website
        run: cd website && pnpm build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        if: github.ref == 'refs/heads/main'
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./website/build
```

#### Manual Deployment

For manual deployment (if needed):

```bash
# Build the documentation
pnpm docs:full

# Deploy to GitHub Pages (from website directory)
cd website
pnpm deploy
```

### Deployment Verification

After deployment, verify:

1. **Site accessibility**: Visit the deployed URL
2. **Navigation**: Test all menu items and links
3. **Search**: Verify search functionality works
4. **API docs**: Check that API documentation is current
5. **Mobile**: Test on mobile devices

**Deployed URL**: `https://standardbeagle.github.io/ageSchemaClient/`

## Configuration Management

### Docusaurus Configuration

Key configuration files:

#### `website/docusaurus.config.ts`

```typescript
const config: Config = {
  title: 'Apache AGE Schema Client',
  tagline: 'TypeScript client for Apache AGE graph databases',
  url: 'https://standardbeagle.github.io',
  baseUrl: '/ageSchemaClient/',
  organizationName: 'standardbeagle',
  projectName: 'ageSchemaClient',
  
  // ... other configuration
};
```

#### `website/sidebars.ts`

```typescript
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/installation', 'getting-started/quick-start'],
    },
    // ... other sidebar items
  ],
};
```

### TypeDoc Configuration

#### `typedoc.json`

```json
{
  "entryPoints": ["./src/index.ts"],
  "out": "./website/docs/api-generated",
  "plugin": ["typedoc-plugin-markdown"],
  "tsconfig": "./tsconfig.json",
  "readme": "none",
  "entryFileName": "index.md",
  "outputFileStrategy": "members",
  "fileExtension": ".md",
  "publicPath": "/ageSchemaClient/api-generated/"
}
```

## Troubleshooting

### Common Build Issues

#### TypeDoc Generation Fails

**Symptoms**: API documentation not generated or outdated

**Solutions**:
```bash
# Clean and regenerate
pnpm docs:api:clean
pnpm docs:api

# Check TypeScript compilation
pnpm build

# Verify TypeDoc configuration
npx typedoc --help
```

#### Docusaurus Build Fails

**Symptoms**: Website build errors or warnings

**Solutions**:
```bash
# Clear Docusaurus cache
cd website
pnpm clear

# Check for broken links
pnpm build 2>&1 | grep -i "broken"

# Verify all dependencies
pnpm install
```

#### Deployment Issues

**Symptoms**: Site not updating or deployment failures

**Solutions**:
1. Check GitHub Actions logs
2. Verify GitHub Pages settings
3. Ensure base URL configuration is correct
4. Test local build before deployment

### Performance Issues

#### Slow Build Times

**Optimization strategies**:
- Use incremental builds during development
- Optimize image sizes in `website/static/`
- Minimize external dependencies
- Use caching in CI/CD pipeline

#### Large Bundle Size

**Reduction techniques**:
- Optimize images and assets
- Remove unused dependencies
- Use code splitting for large components
- Minimize custom CSS and JavaScript

## Maintenance Tasks

### Regular Maintenance

#### Weekly
- [ ] Check for broken links
- [ ] Review and update outdated content
- [ ] Monitor build performance

#### Monthly
- [ ] Update dependencies
- [ ] Review analytics and user feedback
- [ ] Optimize search indexing

#### Per Release
- [ ] Update version numbers
- [ ] Generate fresh API documentation
- [ ] Update changelog and release notes
- [ ] Test deployment process

### Monitoring

#### Build Health
- Monitor GitHub Actions for build failures
- Set up notifications for deployment issues
- Track build times and performance

#### Content Quality
- Regular link checking
- Spell checking and grammar review
- User feedback monitoring
- Analytics review for popular content

This comprehensive build and deployment guide ensures reliable, maintainable documentation infrastructure for the Apache AGE Schema Client project.
