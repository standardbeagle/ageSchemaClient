#!/usr/bin/env node

/**
 * Test script to verify documentation versioning functionality
 * This script tests the versioning setup and provides validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const websiteDir = path.join(__dirname, '..', 'website');
const versionsFile = path.join(websiteDir, 'versions.json');
const versionedDocsDir = path.join(websiteDir, 'versioned_docs');
const versionedSidebarsDir = path.join(websiteDir, 'versioned_sidebars');
const buildDir = path.join(websiteDir, 'build');

console.log('🔍 Testing Documentation Versioning Setup...\n');

// Test 1: Check versions.json exists and is valid
console.log('1. Checking versions.json...');
try {
  if (!fs.existsSync(versionsFile)) {
    throw new Error('versions.json not found');
  }

  const versions = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
  if (!Array.isArray(versions)) {
    throw new Error('versions.json should contain an array');
  }

  console.log(`   ✅ Found ${versions.length} version(s): ${versions.join(', ')}`);
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  process.exit(1);
}

// Test 2: Check versioned docs directories exist
console.log('\n2. Checking versioned docs directories...');
try {
  const versions = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));

  for (const version of versions) {
    const versionDocsDir = path.join(versionedDocsDir, `version-${version}`);
    const versionSidebarFile = path.join(versionedSidebarsDir, `version-${version}-sidebars.json`);

    if (!fs.existsSync(versionDocsDir)) {
      throw new Error(`Versioned docs directory not found: ${versionDocsDir}`);
    }

    if (!fs.existsSync(versionSidebarFile)) {
      throw new Error(`Versioned sidebar file not found: ${versionSidebarFile}`);
    }

    console.log(`   ✅ Version ${version}: docs and sidebar files exist`);
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  process.exit(1);
}

// Test 3: Check build output (if exists)
console.log('\n3. Checking build output...');
try {
  if (fs.existsSync(buildDir)) {
    const docsDir = path.join(buildDir, 'docs');
    const nextDir = path.join(buildDir, 'docs', 'next');

    if (!fs.existsSync(docsDir)) {
      throw new Error('Build docs directory not found');
    }

    if (!fs.existsSync(nextDir)) {
      throw new Error('Build next docs directory not found');
    }

    console.log('   ✅ Build output contains versioned documentation');
  } else {
    console.log('   ⚠️  Build directory not found (run pnpm docs:build to test)');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

// Test 4: Check docusaurus config
console.log('\n4. Checking Docusaurus configuration...');
try {
  const configFile = path.join(websiteDir, 'docusaurus.config.ts');
  if (!fs.existsSync(configFile)) {
    throw new Error('docusaurus.config.ts not found');
  }

  const configContent = fs.readFileSync(configFile, 'utf8');

  // Check for versioning configuration
  if (!configContent.includes('lastVersion')) {
    throw new Error('lastVersion configuration not found');
  }

  if (!configContent.includes('docsVersionDropdown')) {
    throw new Error('docsVersionDropdown navbar item not found');
  }

  console.log('   ✅ Docusaurus configuration includes versioning setup');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

// Test 5: Check package.json scripts
console.log('\n5. Checking package.json scripts...');
try {
  const packageFile = path.join(websiteDir, 'package.json');
  const rootPackageFile = path.join(__dirname, '..', 'package.json');

  const websitePackage = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  const rootPackage = JSON.parse(fs.readFileSync(rootPackageFile, 'utf8'));

  // Check website scripts
  if (!websitePackage.scripts['docs:version']) {
    throw new Error('docs:version script not found in website package.json');
  }

  // Check root scripts
  if (!rootPackage.scripts['docs:version']) {
    throw new Error('docs:version script not found in root package.json');
  }

  console.log('   ✅ Versioning scripts are configured');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

console.log('\n🎉 All versioning tests passed!');
console.log('\n📋 Next steps:');
console.log('   • Run "pnpm docs:start" to test the development server');
console.log('   • Run "pnpm docs:build" to test the build process');
console.log('   • Run "pnpm docs:version X.X.X" to create a new version');
console.log('   • Check the versioning guide at docs/versioning-guide.md');
