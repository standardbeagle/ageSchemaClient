# GitHub Pages Setup Instructions

The documentation website is already configured to deploy automatically to GitHub Pages. Here's what you need to do to enable it:

## 1. Enable GitHub Pages in Repository Settings

1. Go to your repository on GitHub: https://github.com/standardbeagle/ageSchemaClient
2. Click on "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "GitHub Actions" (not "Deploy from a branch")

## 2. Verify Workflow Permissions

1. In Settings, go to "Actions" → "General"
2. Scroll down to "Workflow permissions"
3. Select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Click "Save"

## 3. Trigger the Deployment

The documentation will automatically deploy when:
- You push to the `main` branch
- The push includes changes to files in `website/`, `docs/`, or `.github/workflows/documentation.yml`

To manually trigger a deployment:
1. Go to the "Actions" tab in your repository
2. Select "Documentation CI/CD" workflow
3. Click "Run workflow"
4. Select the `main` branch
5. Click "Run workflow"

## 4. Access Your Documentation

Once deployed, your documentation will be available at:
https://standardbeagle.github.io/ageSchemaClient/

## Current Configuration

The website is configured with:
- **Base URL**: `/ageSchemaClient/`
- **Organization**: `standardbeagle`
- **Project Name**: `ageSchemaClient`
- **Automatic deployment** on push to main branch
- **TypeDoc integration** for API documentation
- **Algolia search** (requires API keys in repository secrets)

## Repository Secrets Required

For full functionality, add these secrets in Settings → Secrets:
- `ALGOLIA_APP_ID` (optional, for search)
- `ALGOLIA_SEARCH_API_KEY` (optional, for search)
- `ALGOLIA_INDEX_NAME` (optional, defaults to 'ageSchemaClient')

## Local Development

To test the website locally:
```bash
cd website
pnpm install
pnpm start
```

The site will be available at http://localhost:3000/ageSchemaClient/

To build and serve the production version:
```bash
pnpm build
pnpm serve
```