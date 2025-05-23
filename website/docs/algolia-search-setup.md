# Algolia DocSearch Setup Guide

This guide walks you through setting up Algolia DocSearch for the ageSchemaClient documentation site.

## Current Status

✅ **Configuration Complete**: Algolia DocSearch is fully configured in the Docusaurus setup
✅ **Package Installed**: `@docusaurus/theme-search-algolia` is installed and ready
✅ **Documentation Ready**: Comprehensive setup guide and troubleshooting available
⏳ **Pending**: Algolia DocSearch application submission (requires deployed site)
⏳ **Pending**: API keys and index setup from Algolia

## Overview

Algolia DocSearch provides powerful search capabilities for documentation sites. It's free for open source projects and integrates seamlessly with Docusaurus.

## Prerequisites

- Public documentation website (production ready)
- Technical documentation content
- Website owner permissions
- GitHub repository with documentation

## Next Steps

### Immediate Actions Required

1. **Deploy Documentation Site**: The site must be publicly accessible before applying to Algolia DocSearch
2. **Submit Algolia Application**: Once deployed, apply at [https://docsearch.algolia.com/apply/](https://docsearch.algolia.com/apply/)
3. **Update Environment Variables**: Add the provided API keys to GitHub Actions secrets and environment configuration

### Deployment Checklist

- [ ] Documentation site is deployed to GitHub Pages
- [ ] Site is publicly accessible at `https://standardbeagle.github.io/ageSchemaClient/`
- [ ] All documentation content is substantial and production-ready
- [ ] Site navigation and content structure is finalized

## Step 1: Apply for Algolia DocSearch

### Application Process

1. **Visit the Application Page**: Go to [https://docsearch.algolia.com/apply/](https://docsearch.algolia.com/apply/)

2. **Fill Out the Application Form**:
   - **Website URL**: `https://standardbeagle.github.io/ageSchemaClient/`
   - **Email**: Your contact email
   - **Repository URL**: `https://github.com/standardbeagle/ageSchemaClient`
   - **Description**: "Technical documentation for ageSchemaClient, a TypeScript library for Apache AGE graph databases"

3. **Checklist Requirements**:
   - ✅ Technical documentation website
   - ✅ Website owner permissions
   - ✅ Publicly available website
   - ✅ Production ready content

### Application Criteria

According to Algolia's requirements, your application should meet:

- **Technical Content**: Documentation for developers, APIs, or technical blogs
- **Public Access**: No authentication required to access content
- **Production Ready**: Substantial content, not placeholder text
- **Owner Permissions**: Ability to modify the website code

### Expected Timeline

- **Application Review**: 1-2 weeks
- **Setup Process**: Additional 1-2 weeks after approval
- **Total Time**: Up to 4 weeks from application to deployment

## Step 2: Receive Algolia Configuration

Once approved, Algolia will provide:

- **Application ID** (`appId`)
- **Search API Key** (`apiKey`)
- **Index Name** (`indexName`)
- **Crawler Configuration**

## Step 3: Configure Environment Variables

Create a `.env.local` file in the website directory:

```bash
# Algolia DocSearch Configuration
ALGOLIA_APP_ID=your_app_id_here
ALGOLIA_SEARCH_API_KEY=your_search_api_key_here
ALGOLIA_INDEX_NAME=ageSchemaClient
```

**Important**:
- The search API key is public and safe to commit
- Never commit the admin API key
- Use environment variables for production deployment

## Step 4: Update Docusaurus Configuration

The Algolia configuration is already added to `docusaurus.config.ts`:

```typescript
algolia: {
  appId: process.env.ALGOLIA_APP_ID || 'YOUR_APP_ID',
  apiKey: process.env.ALGOLIA_SEARCH_API_KEY || 'YOUR_SEARCH_API_KEY',
  indexName: process.env.ALGOLIA_INDEX_NAME || 'ageSchemaClient',
  contextualSearch: true,
  searchParameters: {
    facetFilters: ['language:en'],
    hitsPerPage: 10,
  },
  searchPagePath: 'search',
  insights: false,
}
```

## Step 5: Test Search Functionality

### Local Testing

1. **Start Development Server**:
   ```bash
   cd website
   pnpm start
   ```

2. **Test Search**:
   - Look for search box in navbar
   - Try searching for "Apache AGE", "query builder", "batch loader"
   - Verify search results are relevant and fast

### Production Testing

1. **Build and Deploy**:
   ```bash
   pnpm build
   pnpm deploy
   ```

2. **Test Live Site**:
   - Verify search works on deployed site
   - Test on mobile devices
   - Check search response times (should be < 500ms)

## Step 6: Optimize Search Configuration

### Search Parameters

Customize search behavior in `docusaurus.config.ts`:

```typescript
searchParameters: {
  facetFilters: ['language:en'],
  hitsPerPage: 10,
  attributesToRetrieve: [
    'hierarchy.lvl0',
    'hierarchy.lvl1',
    'hierarchy.lvl2',
    'content',
    'url'
  ],
  attributesToHighlight: [
    'hierarchy.lvl0',
    'hierarchy.lvl1',
    'hierarchy.lvl2',
    'content'
  ],
}
```

### Contextual Search

Enable contextual search for better results:

```typescript
contextualSearch: true
```

This ensures search results are relevant to the current documentation section.

### Custom Search Page

The search page is enabled by default at `/search`. To customize:

```typescript
searchPagePath: 'search', // or 'custom-search' or false to disable
```

## Troubleshooting

### Common Issues

1. **Search Box Not Appearing**:
   - Verify `@docusaurus/theme-search-algolia` is installed
   - Check configuration syntax in `docusaurus.config.ts`
   - Restart development server

2. **No Search Results**:
   - Verify API keys are correct
   - Check if index has been populated by Algolia crawler
   - Ensure website is publicly accessible

3. **Slow Search Performance**:
   - Check network connectivity
   - Verify search parameters are optimized
   - Contact Algolia support if issues persist

### Debug Mode

Enable debug mode to troubleshoot:

```typescript
algolia: {
  // ... other config
  debug: process.env.NODE_ENV === 'development',
}
```

## Performance Optimization

### Search Response Time

Target metrics:
- **Search Response**: < 500ms
- **First Keystroke**: < 100ms
- **Subsequent Keystrokes**: < 50ms

### Index Optimization

Work with Algolia to optimize:
- **Crawler Configuration**: Ensure all important content is indexed
- **Ranking Formula**: Prioritize important pages
- **Faceting**: Enable filtering by content type

## Maintenance

### Regular Tasks

1. **Monitor Search Analytics**: Review search queries and results
2. **Update Content**: Ensure new documentation is crawled
3. **Performance Monitoring**: Track search response times
4. **User Feedback**: Collect feedback on search experience

### Crawler Updates

Algolia will automatically crawl your site, but you can:
- Request manual crawls for urgent updates
- Adjust crawler frequency if needed
- Update crawler configuration for new content types

## Security Considerations

### API Key Management

- **Search API Key**: Public, safe to commit and expose
- **Admin API Key**: Private, never commit or expose
- **Environment Variables**: Use for production deployments

### Content Security

- Ensure only public content is indexed
- Review crawler configuration regularly
- Monitor for any sensitive data in search results

## Support and Resources

### Documentation
- [Algolia DocSearch Documentation](https://docsearch.algolia.com/)
- [Docusaurus Search Documentation](https://docusaurus.io/docs/search)

### Support Channels
- [Algolia Community Discord](https://discord.com/invite/W7kYfh7FKQ)
- [GitHub Issues](https://github.com/algolia/docsearch/issues)
- [Algolia Support](https://www.algolia.com/support/)

### Monitoring
- Algolia Dashboard for analytics
- Search performance metrics
- User feedback and usage patterns

This setup provides a robust, fast, and user-friendly search experience for the ageSchemaClient documentation.
