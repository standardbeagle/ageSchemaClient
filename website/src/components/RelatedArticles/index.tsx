/**
 * Related Articles Component
 * 
 * Displays related articles at the end of documentation pages
 */

import React from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './styles.module.css';

interface RelatedArticle {
  title: string;
  href: string;
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface RelatedArticlesProps {
  currentPath: string;
  manualRelated?: RelatedArticle[];
  maxItems?: number;
}

function RelatedArticles({
  currentPath,
  manualRelated = [],
  maxItems = 6
}: RelatedArticlesProps): JSX.Element | null {
  if (manualRelated.length === 0) {
    return null;
  }

  const articles = manualRelated.slice(0, maxItems);

  return (
    <section className={styles.relatedArticlesSection}>
      <h2 className={styles.sectionTitle}>Related Articles</h2>
      <div className={styles.articlesGrid}>
        {articles.map((article) => (
          <Link
            key={article.href}
            to={article.href}
            className={clsx(styles.articleCard, 'card')}
          >
            <h3 className={styles.articleTitle}>
              {article.title}
            </h3>
            {article.description && (
              <p className={styles.articleDescription}>
                {article.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default RelatedArticles;
