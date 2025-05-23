/**
 * Custom Logo Component for ageSchemaClient
 * 
 * A simple SVG-based logo that represents graph networks and connections.
 * Designed to work well in both light and dark themes.
 */

import React from 'react';
import styles from './styles.module.css';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function Logo({ className, width = 32, height = 32 }: LogoProps): React.ReactElement {
  return (
    <svg
      className={`${styles.logo} ${className || ''}`}
      width={width}
      height={height}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ageSchemaClient Logo"
    >
      {/* Graph nodes */}
      <circle cx="8" cy="8" r="3" className={styles.node} />
      <circle cx="24" cy="8" r="3" className={styles.node} />
      <circle cx="16" cy="20" r="3" className={styles.node} />
      <circle cx="8" cy="24" r="2.5" className={styles.nodeSecondary} />
      <circle cx="24" cy="24" r="2.5" className={styles.nodeSecondary} />
      
      {/* Graph edges */}
      <line x1="8" y1="8" x2="24" y2="8" className={styles.edge} strokeWidth="2" />
      <line x1="8" y1="8" x2="16" y2="20" className={styles.edge} strokeWidth="2" />
      <line x1="24" y1="8" x2="16" y2="20" className={styles.edge} strokeWidth="2" />
      <line x1="16" y1="20" x2="8" y2="24" className={styles.edge} strokeWidth="1.5" />
      <line x1="16" y1="20" x2="24" y2="24" className={styles.edge} strokeWidth="1.5" />
      <line x1="8" y1="24" x2="24" y2="24" className={styles.edgeSecondary} strokeWidth="1.5" />
      
      {/* Central connection indicator */}
      <circle cx="16" cy="14" r="1.5" className={styles.centerNode} />
    </svg>
  );
}

export function LogoWithText({ className }: { className?: string }): React.ReactElement {
  return (
    <div className={`${styles.logoWithText} ${className || ''}`}>
      <Logo width={28} height={28} />
      <span className={styles.logoText}>ageSchemaClient</span>
    </div>
  );
}
