/**
 * Glossary Page
 *
 * Dedicated page for the comprehensive glossary of terms
 * used throughout the ageSchemaClient documentation.
 */

import React from 'react';
import Layout from '@theme/Layout';
import Glossary from '../components/Glossary/index';

export default function GlossaryPage(): JSX.Element {
  return (
    <Layout
      title="Glossary"
      description="Comprehensive glossary of terms used in ageSchemaClient and Apache AGE graph databases"
    >
      <main>
        <Glossary
          searchable={true}
          categorized={true}
          showExamples={true}
          showRelatedTerms={true}
        />
      </main>
    </Layout>
  );
}
