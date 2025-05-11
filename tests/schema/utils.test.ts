import { describe, it, expect } from 'vitest';
import {
  parseVersion,
  formatVersion,
} from '../../src/schema/utils';

describe('Schema Utils', () => {
  describe('parseVersion', () => {
    it('should parse a simple version string', () => {
      const version = parseVersion('1.2.3');
      
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
      expect(version.prerelease).toBeUndefined();
      expect(version.build).toBeUndefined();
    });
    
    it('should parse a version string with prerelease', () => {
      const version = parseVersion('1.2.3-alpha.1');
      
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
      expect(version.prerelease).toBe('alpha.1');
      expect(version.build).toBeUndefined();
    });
    
    it('should parse a version string with build metadata', () => {
      const version = parseVersion('1.2.3+build.456');
      
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
      expect(version.prerelease).toBeUndefined();
      expect(version.build).toBe('build.456');
    });
    
    it('should parse a version string with prerelease and build metadata', () => {
      const version = parseVersion('1.2.3-alpha.1+build.456');
      
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
      expect(version.prerelease).toBe('alpha.1');
      expect(version.build).toBe('build.456');
    });
    
    it('should throw an error for invalid version strings', () => {
      expect(() => parseVersion('invalid')).toThrow();
      expect(() => parseVersion('1.2')).toThrow();
      expect(() => parseVersion('1.2.3.4')).toThrow();
      expect(() => parseVersion('1.2.x')).toThrow();
    });
  });
  
  describe('formatVersion', () => {
    it('should format a simple version object', () => {
      const version = {
        major: 1,
        minor: 2,
        patch: 3,
      };
      
      expect(formatVersion(version)).toBe('1.2.3');
    });
    
    it('should format a version object with prerelease', () => {
      const version = {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'alpha.1',
      };
      
      expect(formatVersion(version)).toBe('1.2.3-alpha.1');
    });
    
    it('should format a version object with build metadata', () => {
      const version = {
        major: 1,
        minor: 2,
        patch: 3,
        build: 'build.456',
      };
      
      expect(formatVersion(version)).toBe('1.2.3+build.456');
    });
    
    it('should format a version object with prerelease and build metadata', () => {
      const version = {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'alpha.1',
        build: 'build.456',
      };
      
      expect(formatVersion(version)).toBe('1.2.3-alpha.1+build.456');
    });
  });
});
