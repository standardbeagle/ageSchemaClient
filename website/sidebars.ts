import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  tutorialSidebar: [
    'intro',
    'versioning-guide',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/basic-usage',
        'getting-started/connection-config',
        'getting-started/first-graph',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api-reference/client',
        'api-reference/query-builder',
        'api-reference/batch-loader',
        'api-reference/schema-manager',
        'api-reference/transaction',
      ],
    },
    {
      type: 'category',
      label: 'How-To Guides',
      items: [
        'how-to-guides/basic-queries',
        'how-to-guides/advanced-queries',
        'how-to-guides/batch-operations',
        'how-to-guides/schema-validation',
        'how-to-guides/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/connection-management',
        'architecture/query-processing',
        'architecture/extension-development',
      ],
    },
  ],
};

export default sidebars;
