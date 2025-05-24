import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'ageSchemaClient Documentation',
  tagline: 'Comprehensive API documentation for Apache AGE graph databases',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://standardbeagle.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/ageSchemaClient/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'standardbeagle', // Usually your GitHub org/user name.
  projectName: 'ageSchemaClient', // Usually your repo name.

  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'ignore',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/standardbeagle/ageSchemaClient/tree/main/website/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/standardbeagle/ageSchemaClient/tree/main/website/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: ['../src/index.ts'],
        tsconfig: '../tsconfig.json',
        out: 'api-generated',
        readme: 'none',
        sidebar: {
          fullNames: true,
        },
        plugin: ['typedoc-plugin-markdown'],
        hidePageTitle: false,
        hidePageHeader: false,
        hideBreadcrumbs: false,
        useCodeBlocks: true,
        parametersFormat: 'table',
        interfacePropertiesFormat: 'table',
        classPropertiesFormat: 'table',
        enumMembersFormat: 'table',
        typeDeclarationFormat: 'table',
        propertyMembersFormat: 'table',
        typeAliasPropertiesFormat: 'table',
        excludePrivate: true,
        excludeProtected: false,
        excludeInternal: true,
        excludeNotDocumented: false,
        categorizeByGroup: true,
        categoryOrder: [
          'Classes',
          'Interfaces',
          'Type Aliases',
          'Functions',
          'Variables',
          '*'
        ],
        sort: ['source-order'],
        gitRevision: 'main',
        sourceLinkTemplate: 'https://github.com/standardbeagle/ageSchemaClient/blob/{gitRevision}/{path}#L{line}',
        disableSources: false,
        includeVersion: true,
        cleanOutputDir: true,
        watch: process.env.TYPEDOC_WATCH === 'true',
      },
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    // Algolia DocSearch configuration
    algolia: {
      // The application ID provided by Algolia
      appId: process.env.ALGOLIA_APP_ID || 'YOUR_APP_ID',

      // Public API key: it is safe to commit it
      apiKey: process.env.ALGOLIA_SEARCH_API_KEY || 'YOUR_SEARCH_API_KEY',

      // The index name provided by Algolia
      indexName: process.env.ALGOLIA_INDEX_NAME || 'ageSchemaClient',

      // Optional: see doc section below
      contextualSearch: true,

      // Optional: Specify domains where the navigation should occur through window.location instead on history.push
      externalUrlRegex: 'external\\.com|domain\\.com',

      // Optional: Replace parts of the item URLs from Algolia
      replaceSearchResultPathname: {
        from: '/docs/',
        to: '/',
      },

      // Optional: Algolia search parameters
      searchParameters: {
        facetFilters: ['language:en'],
        hitsPerPage: 10,
      },

      // Optional: path for search page that enabled by default (`false` to disable it)
      searchPagePath: 'search',

      // Optional: whether the insights feature is enabled or not on Docsearch (`false` by default)
      insights: false,
    },
    navbar: {
      title: 'ageSchemaClient',
      logo: {
        alt: 'ageSchemaClient Logo',
        src: 'img/logo.svg',
        width: 32,
        height: 32,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/standardbeagle/ageSchemaClient',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'API Reference',
              to: '/docs/api-reference',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/apache-age',
            },
            {
              label: 'GitHub Issues',
              href: 'https://github.com/standardbeagle/ageSchemaClient/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/standardbeagle/ageSchemaClient',
            },
            {
              label: 'npm Package',
              href: 'https://www.npmjs.com/package/age-schema-client',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ageSchemaClient. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
