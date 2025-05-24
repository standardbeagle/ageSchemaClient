/**
 * Custom Breadcrumb Component for ageSchemaClient Documentation
 * 
 * Provides enhanced breadcrumb navigation with:
 * - Automatic breadcrumb generation from page hierarchy
 * - Custom styling and icons
 * - Accessibility features
 * - Mobile-responsive design
 */

import React from 'react';
import {useBreadcrumbs} from '@docusaurus/theme-common/internal';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './styles.module.css';

interface BreadcrumbItem {
  href?: string;
  label: string;
  isLast?: boolean;
}

function BreadcrumbsComponent(): JSX.Element | null {
  const breadcrumbs = useBreadcrumbs();

  if (!breadcrumbs || breadcrumbs.length <= 1) {
    return null;
  }

  const breadcrumbItems: BreadcrumbItem[] = breadcrumbs.map((breadcrumb, index) => ({
    href: breadcrumb.href,
    label: breadcrumb.label,
    isLast: index === breadcrumbs.length - 1,
  }));

  return (
    <nav 
      aria-label="Breadcrumbs" 
      className={clsx('breadcrumbs', styles.breadcrumbsContainer)}
    >
      <ol className={styles.breadcrumbsList}>
        {breadcrumbItems.map((breadcrumb, index) => (
          <li key={breadcrumb.href || index} className={styles.breadcrumbItem}>
            {breadcrumb.isLast ? (
              <span 
                className={clsx(styles.breadcrumbText, styles.breadcrumbCurrent)}
                aria-current="page"
              >
                {breadcrumb.label}
              </span>
            ) : (
              <>
                <Link 
                  to={breadcrumb.href!} 
                  className={clsx(styles.breadcrumbText, styles.breadcrumbLink)}
                >
                  {breadcrumb.label}
                </Link>
                <span className={styles.breadcrumbSeparator} aria-hidden="true">
                  /
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default BreadcrumbsComponent;
