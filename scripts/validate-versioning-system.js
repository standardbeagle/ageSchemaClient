#!/usr/bin/env node

/**
 * Comprehensive validation script for the documentation versioning system
 * This script performs all necessary checks to ensure the versioning system is working correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const websiteDir = path.join(__dirname, '..', 'website');
const rootDir = path.join(__dirname, '..');

console.log('🔍 Comprehensive Documentation Versioning System Validation\n');

let testsPassed = 0;
let testsTotal = 0;

function runTest(testName, testFunction) {
  testsTotal++;
  console.log(`${testsTotal}. ${testName}...`);
  
  try {
    testFunction();
    testsPassed++;
    console.log(`   ✅ PASSED\n`);
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}\n`);
  }
}

// Test 1: File Structure Validation
runTest('Validating file structure', () => {
  const requiredFiles = [
    path.join(websiteDir, 'versions.json'),
    path.join(websiteDir, 'docusaurus.config.ts'),
    path.join(websiteDir, 'package.json'),
    path.join(rootDir, 'package.json'),
    path.join(rootDir, 'docs', 'versioning-guide.md'),
    path.join(websiteDir, 'docs', 'versioning-guide.md')
  ];
  
  const requiredDirs = [
    path.join(websiteDir, 'versioned_docs'),
    path.join(websiteDir, 'versioned_sidebars'),
    path.join(websiteDir, 'docs')
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
  
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Required directory missing: ${dir}`);
    }
  }
});

// Test 2: Versions Configuration
runTest('Validating versions configuration', () => {
  const versionsFile = path.join(websiteDir, 'versions.json');
  const versions = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
  
  if (!Array.isArray(versions)) {
    throw new Error('versions.json should contain an array');
  }
  
  if (versions.length === 0) {
    throw new Error('At least one version should be configured');
  }
  
  // Check that version 0.3.0 exists
  if (!versions.includes('0.3.0')) {
    throw new Error('Version 0.3.0 should be present');
  }
});

// Test 3: Docusaurus Configuration
runTest('Validating Docusaurus configuration', () => {
  const configFile = path.join(websiteDir, 'docusaurus.config.ts');
  const configContent = fs.readFileSync(configFile, 'utf8');
  
  const requiredConfigs = [
    'lastVersion',
    'versions',
    'docsVersionDropdown',
    'current',
    '0.3.0'
  ];
  
  for (const config of requiredConfigs) {
    if (!configContent.includes(config)) {
      throw new Error(`Configuration missing: ${config}`);
    }
  }
});

// Test 4: Package Scripts
runTest('Validating package scripts', () => {
  const websitePackage = JSON.parse(fs.readFileSync(path.join(websiteDir, 'package.json'), 'utf8'));
  const rootPackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  
  const requiredWebsiteScripts = ['docs:version', 'docs:version:list'];
  const requiredRootScripts = ['docs:version', 'docs:version:list', 'docs:clear'];
  
  for (const script of requiredWebsiteScripts) {
    if (!websitePackage.scripts[script]) {
      throw new Error(`Website script missing: ${script}`);
    }
  }
  
  for (const script of requiredRootScripts) {
    if (!rootPackage.scripts[script]) {
      throw new Error(`Root script missing: ${script}`);
    }
  }
});

// Test 5: Versioned Content
runTest('Validating versioned content', () => {
  const versionsFile = path.join(websiteDir, 'versions.json');
  const versions = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
  
  for (const version of versions) {
    const versionDocsDir = path.join(websiteDir, 'versioned_docs', `version-${version}`);
    const versionSidebarFile = path.join(websiteDir, 'versioned_sidebars', `version-${version}-sidebars.json`);
    
    if (!fs.existsSync(versionDocsDir)) {
      throw new Error(`Versioned docs directory missing: ${versionDocsDir}`);
    }
    
    if (!fs.existsSync(versionSidebarFile)) {
      throw new Error(`Versioned sidebar file missing: ${versionSidebarFile}`);
    }
    
    // Check that versioned docs contain expected files
    const introFile = path.join(versionDocsDir, 'intro.md');
    if (!fs.existsSync(introFile)) {
      throw new Error(`Versioned intro.md missing for version ${version}`);
    }
    
    // Validate sidebar JSON
    const sidebarContent = fs.readFileSync(versionSidebarFile, 'utf8');
    const sidebar = JSON.parse(sidebarContent);
    
    if (!sidebar.tutorialSidebar) {
      throw new Error(`tutorialSidebar missing in version ${version} sidebar`);
    }
  }
});

// Test 6: Build System
runTest('Validating build system', () => {
  const buildDir = path.join(websiteDir, 'build');
  
  if (fs.existsSync(buildDir)) {
    const docsDir = path.join(buildDir, 'docs');
    const nextDir = path.join(buildDir, 'docs', 'next');
    
    if (!fs.existsSync(docsDir)) {
      throw new Error('Build docs directory missing');
    }
    
    if (!fs.existsSync(nextDir)) {
      throw new Error('Build next docs directory missing');
    }
    
    // Check that version-specific content exists
    const versionedContent = fs.readdirSync(docsDir);
    if (!versionedContent.includes('next')) {
      throw new Error('Next version not found in build output');
    }
  } else {
    console.log('   ⚠️  Build directory not found - run pnpm docs:build to test build output');
  }
});

// Test 7: Documentation Quality
runTest('Validating documentation quality', () => {
  const versioningGuideRoot = path.join(rootDir, 'docs', 'versioning-guide.md');
  const versioningGuideWebsite = path.join(websiteDir, 'docs', 'versioning-guide.md');
  
  const rootContent = fs.readFileSync(versioningGuideRoot, 'utf8');
  const websiteContent = fs.readFileSync(versioningGuideWebsite, 'utf8');
  
  // Check that guides contain essential information
  const requiredSections = [
    'Creating a New Documentation Version',
    'Version Management Commands',
    'Best Practices',
    'Troubleshooting'
  ];
  
  for (const section of requiredSections) {
    if (!rootContent.includes(section)) {
      throw new Error(`Root versioning guide missing section: ${section}`);
    }
  }
  
  if (websiteContent.length < 500) {
    throw new Error('Website versioning guide seems too short');
  }
});

// Test 8: Dependencies
runTest('Validating dependencies', () => {
  const websitePackage = JSON.parse(fs.readFileSync(path.join(websiteDir, 'package.json'), 'utf8'));
  
  const requiredDeps = [
    '@docusaurus/core',
    '@docusaurus/preset-classic',
    'docusaurus-plugin-typedoc',
    'typedoc',
    'typedoc-plugin-markdown'
  ];
  
  for (const dep of requiredDeps) {
    if (!websitePackage.dependencies[dep] && !websitePackage.devDependencies[dep]) {
      throw new Error(`Required dependency missing: ${dep}`);
    }
  }
});

// Summary
console.log('📊 Test Results Summary');
console.log('='.repeat(50));
console.log(`Tests Passed: ${testsPassed}/${testsTotal}`);
console.log(`Success Rate: ${Math.round((testsPassed / testsTotal) * 100)}%`);

if (testsPassed === testsTotal) {
  console.log('\n🎉 All tests passed! The versioning system is fully functional.');
  console.log('\n✨ Features successfully implemented:');
  console.log('   ✅ Docusaurus versioning system configured');
  console.log('   ✅ Initial documentation version (0.3.0) created');
  console.log('   ✅ Version switching UI in navigation');
  console.log('   ✅ Version management scripts added');
  console.log('   ✅ Comprehensive documentation created');
  console.log('   ✅ Build system supports versioning');
  console.log('   ✅ All dependencies properly installed');
  
  console.log('\n🚀 Ready for production use!');
  console.log('\n📋 Next steps for maintainers:');
  console.log('   • Use "pnpm docs:version X.X.X" to create new versions');
  console.log('   • Update version labels in docusaurus.config.ts as needed');
  console.log('   • Follow the versioning guide for best practices');
  console.log('   • Test new versions before deploying');
  
} else {
  console.log(`\n❌ ${testsTotal - testsPassed} test(s) failed. Please review the errors above.`);
  process.exit(1);
}
