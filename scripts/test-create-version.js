#!/usr/bin/env node

/**
 * Test script to verify creating a new documentation version
 * This script simulates creating version 0.4.0 for testing purposes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const websiteDir = path.join(__dirname, '..', 'website');
const versionsFile = path.join(websiteDir, 'versions.json');

console.log('🧪 Testing Version Creation Process...\n');

// Read current versions
const currentVersions = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
console.log(`📋 Current versions: ${currentVersions.join(', ')}`);

// Test version: 0.4.0-test
const testVersion = '0.4.0-test';

console.log(`\n🔄 Creating test version: ${testVersion}`);

try {
  // Create the test version
  execSync(`cd ${websiteDir} && pnpm docs:version ${testVersion}`, { 
    stdio: 'pipe',
    encoding: 'utf8'
  });
  
  console.log(`✅ Successfully created version ${testVersion}`);
  
  // Verify the version was created
  const newVersions = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
  
  if (!newVersions.includes(testVersion)) {
    throw new Error(`Version ${testVersion} not found in versions.json`);
  }
  
  console.log(`✅ Version ${testVersion} added to versions.json`);
  
  // Check if versioned files were created
  const versionedDocsDir = path.join(websiteDir, 'versioned_docs', `version-${testVersion}`);
  const versionedSidebarFile = path.join(websiteDir, 'versioned_sidebars', `version-${testVersion}-sidebars.json`);
  
  if (!fs.existsSync(versionedDocsDir)) {
    throw new Error(`Versioned docs directory not created: ${versionedDocsDir}`);
  }
  
  if (!fs.existsSync(versionedSidebarFile)) {
    throw new Error(`Versioned sidebar file not created: ${versionedSidebarFile}`);
  }
  
  console.log(`✅ Versioned files created successfully`);
  
  // Clean up - remove the test version
  console.log(`\n🧹 Cleaning up test version...`);
  
  // Remove from versions.json
  const cleanedVersions = newVersions.filter(v => v !== testVersion);
  fs.writeFileSync(versionsFile, JSON.stringify(cleanedVersions, null, 2) + '\n');
  
  // Remove versioned directories
  fs.rmSync(versionedDocsDir, { recursive: true, force: true });
  fs.rmSync(versionedSidebarFile, { force: true });
  
  console.log(`✅ Test version ${testVersion} cleaned up`);
  
  console.log('\n🎉 Version creation test completed successfully!');
  console.log('\n📋 The versioning system is working correctly:');
  console.log('   • New versions can be created with pnpm docs:version');
  console.log('   • Versioned docs and sidebars are generated');
  console.log('   • versions.json is updated automatically');
  console.log('   • The system is ready for production use');
  
} catch (error) {
  console.error(`❌ Error during version creation test: ${error.message}`);
  
  // Attempt cleanup in case of error
  try {
    const currentVersionsAfterError = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
    if (currentVersionsAfterError.includes(testVersion)) {
      const cleanedVersions = currentVersionsAfterError.filter(v => v !== testVersion);
      fs.writeFileSync(versionsFile, JSON.stringify(cleanedVersions, null, 2) + '\n');
      
      const versionedDocsDir = path.join(websiteDir, 'versioned_docs', `version-${testVersion}`);
      const versionedSidebarFile = path.join(websiteDir, 'versioned_sidebars', `version-${testVersion}-sidebars.json`);
      
      fs.rmSync(versionedDocsDir, { recursive: true, force: true });
      fs.rmSync(versionedSidebarFile, { force: true });
      
      console.log('🧹 Cleaned up partial test version');
    }
  } catch (cleanupError) {
    console.error(`⚠️  Cleanup failed: ${cleanupError.message}`);
  }
  
  process.exit(1);
}
