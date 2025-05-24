/**
 * Glossary Component
 * 
 * Provides a comprehensive glossary of terms
 */

import React, { useState, useMemo } from 'react';
import styles from './styles.module.css';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category?: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'apache-age',
    term: 'Apache AGE',
    definition: 'A PostgreSQL extension that provides graph database functionality using the openCypher query language.',
    category: 'Database'
  },
  {
    id: 'cypher',
    term: 'Cypher',
    definition: 'A declarative graph query language that allows for expressive and efficient querying and updating of graph databases.',
    category: 'Query Language'
  },
  {
    id: 'vertex',
    term: 'Vertex',
    definition: 'A node in a graph database that represents an entity. Vertices can have labels and properties.',
    category: 'Graph Concepts'
  },
  {
    id: 'edge',
    term: 'Edge',
    definition: 'A relationship between two vertices in a graph database. Edges can have types and properties.',
    category: 'Graph Concepts'
  }
];

interface GlossaryProps {
  searchable?: boolean;
  categorized?: boolean;
  showExamples?: boolean;
  showRelatedTerms?: boolean;
}

function Glossary({
  searchable = true,
  categorized = true,
  showExamples = true,
  showRelatedTerms = true
}: GlossaryProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter(term => {
      const matchesSearch = !searchTerm || 
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [searchTerm]);

  return (
    <div className={styles.glossaryContainer}>
      <div className={styles.glossaryHeader}>
        <h1>Glossary</h1>
        <p className={styles.glossaryDescription}>
          Comprehensive definitions of terms used in ageSchemaClient and Apache AGE graph databases.
        </p>
      </div>

      {searchable && (
        <div className={styles.searchControls}>
          <input
            type="text"
            placeholder="Search terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      )}

      <div className={styles.termsContainer}>
        <div className={styles.termsList}>
          {filteredTerms.map(term => (
            <div key={term.id} className={styles.termCard} id={term.id}>
              <h3 className={styles.termTitle}>{term.term}</h3>
              <p className={styles.definition}>{term.definition}</p>
            </div>
          ))}
        </div>
      </div>
      
      {filteredTerms.length === 0 && (
        <div className={styles.noResults}>
          <p>No terms found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}

export default Glossary;
