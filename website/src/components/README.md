# Navigation Enhancement Components

This directory contains the implementation of cross-references and navigation enhancements for the ageSchemaClient documentation, as specified in Task ID 14.

## Overview

The navigation enhancement system provides:

1. **Breadcrumb Navigation** - Hierarchical navigation with accessibility support
2. **Related Articles** - Intelligent content suggestions based on tags and categories
3. **Tag System** - Content organization with difficulty levels and content types
4. **Cross-References** - Automatic linking between related concepts with hover previews
5. **Glossary** - Comprehensive searchable term definitions
6. **Enhanced Metadata** - Last updated timestamps and edit links

## Components

### Breadcrumbs (`/Breadcrumbs`)
- **Purpose**: Provides hierarchical navigation showing current page location
- **Features**: 
  - Automatic breadcrumb generation from Docusaurus navigation
  - Accessibility compliant with ARIA labels
  - Mobile responsive design
  - Current page indication
- **Usage**: Automatically included in all documentation pages

### Related Articles (`/RelatedArticles`)
- **Purpose**: Suggests relevant content at the end of each page
- **Features**:
  - Manual relationship definitions via frontmatter
  - Automatic suggestions based on tags and categories
  - Difficulty level indicators
  - Category badges
  - Responsive card layout
- **Usage**: Automatically included based on page metadata

### Tag System (`/TagSystem`)
- **Purpose**: Organizes content by topics, difficulty, and content type
- **Components**:
  - `TagSystem` - Main tag cloud component
  - `DifficultyTag` - Beginner/Intermediate/Advanced indicators
  - `ContentTypeTag` - Tutorial/Guide/Reference/Example/Concept markers
- **Features**:
  - Interactive tag filtering
  - Visual difficulty indicators with icons
  - Content type categorization
  - Responsive design

### Cross-References (`/CrossReferences`)
- **Purpose**: Automatic linking between related concepts
- **Components**:
  - `CrossReferenceSystem` - Automatic term detection and linking
  - `CrossReferenceLink` - Individual cross-reference with hover preview
- **Features**:
  - Intelligent term detection
  - Hover tooltips with previews
  - Configurable reference database
  - Accessibility support

### Glossary (`/Glossary`)
- **Purpose**: Comprehensive searchable term definitions
- **Features**:
  - Search functionality
  - Category filtering
  - Cross-references between terms
  - Examples and external links
  - Responsive design
- **Usage**: Available at `/glossary` route

## Theme Integration

### Custom DocItem Layout (`/theme/DocItem/Layout`)
- **Purpose**: Integrates all navigation features into documentation pages
- **Features**:
  - Custom breadcrumbs
  - Metadata display (tags, difficulty, content type)
  - Related articles integration
  - Last updated timestamps
- **Integration**: Wraps the default Docusaurus DocItem layout

## Configuration

### Docusaurus Configuration
The following features are enabled in `docusaurus.config.ts`:

```typescript
docs: {
  showLastUpdateTime: true,
  showLastUpdateAuthor: true,
  breadcrumbs: true,
  tags: {
    basePath: '/tags',
  },
}
```

### Page Frontmatter
Pages can include the following metadata:

```yaml
---
title: Page Title
tags:
  - topic-tag
  - category-tag
difficulty: beginner|intermediate|advanced
content_type: tutorial|guide|reference|example|concept
last_updated: YYYY-MM-DD
related_articles:
  - /docs/path/to/related/page
---
```

## Styling

All components use CSS Modules for styling with:
- **Theme Integration**: Respects Docusaurus light/dark themes
- **Responsive Design**: Mobile-first approach with breakpoints
- **Accessibility**: High contrast mode support and focus management
- **Print Styles**: Optimized for printing documentation

## Testing

### Test Coverage
- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interaction and data flow
- **Build Tests**: Import and rendering verification
- **Accessibility Tests**: ARIA compliance and keyboard navigation

### Running Tests
```bash
cd website
npm test
```

## Usage Examples

### Adding Tags to a Page
```yaml
---
title: Basic Usage Guide
tags:
  - getting-started
  - tutorial
  - query-builder
difficulty: beginner
content_type: tutorial
related_articles:
  - /docs/getting-started/installation
  - /docs/api-reference/client
---
```

### Using Cross-References
Cross-references are automatically detected for terms like:
- Apache AGE
- Cypher
- Query Builder
- Schema Validation
- Batch Loader

### Manual Related Articles
```yaml
related_articles:
  - /docs/getting-started/installation
  - /docs/how-to-guides/basic-queries
  - /docs/api-reference/client
```

## Customization

### Adding New Cross-References
Edit `src/components/CrossReferences/index.tsx`:

```typescript
const CROSS_REFERENCES: CrossReference[] = [
  {
    term: 'New Term',
    href: '/docs/path/to/definition',
    description: 'Brief description',
    preview: 'Detailed preview text',
    category: 'Category'
  }
];
```

### Adding Glossary Terms
Edit `src/components/Glossary/index.tsx`:

```typescript
const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'new-term',
    term: 'New Term',
    definition: 'Detailed definition',
    category: 'Category',
    aliases: ['Alternative Name'],
    relatedTerms: ['related-term-id'],
    examples: ['Example usage']
  }
];
```

## Performance Considerations

- **Lazy Loading**: Components are loaded only when needed
- **Memoization**: Expensive computations are memoized
- **Debounced Search**: Search inputs use debouncing to reduce API calls
- **Optimized Rendering**: Virtual scrolling for large lists

## Accessibility Features

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Logical focus order
- **High Contrast**: Support for high contrast mode
- **Screen Reader**: Optimized for screen reader users

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Accessibility**: NVDA, JAWS, VoiceOver support

## Contributing

When adding new navigation features:

1. **Follow Patterns**: Use existing component patterns
2. **Add Tests**: Include unit and integration tests
3. **Update Documentation**: Document new features
4. **Accessibility**: Ensure WCAG 2.1 compliance
5. **Performance**: Consider impact on build and runtime performance

## Future Enhancements

Potential improvements for future versions:

- **AI-Powered Suggestions**: Machine learning for better related content
- **User Preferences**: Customizable navigation preferences
- **Analytics Integration**: Track navigation patterns
- **Offline Support**: Cache navigation data for offline use
- **Multi-language**: Internationalization support
