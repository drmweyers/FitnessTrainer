/**
 * Deployment Configuration Validation Tests
 *
 * These tests ensure the Vercel deployment configuration is correct
 * and won't cause production issues (missing assets, broken builds, etc.)
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');

describe('Vercel Deployment Configuration', () => {
  describe('.vercelignore', () => {
    let vercelignore: string;

    beforeAll(() => {
      const filepath = path.join(ROOT, '.vercelignore');
      vercelignore = fs.readFileSync(filepath, 'utf-8');
    });

    it('should NOT exclude the public directory', () => {
      // public/ contains static assets (logo, images) required for rendering
      const lines = vercelignore.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      const excludesPublic = lines.some(line => line === 'public' || line === 'public/');
      expect(excludesPublic).toBe(false);
    });

    it('should NOT exclude package-lock.json', () => {
      // package-lock.json ensures deterministic installs on Vercel
      const lines = vercelignore.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      const excludesLockfile = lines.some(line => line === 'package-lock.json');
      expect(excludesLockfile).toBe(false);
    });

    it('should NOT exclude all PNG/JPG/SVG files', () => {
      // Blanket image exclusion breaks static assets in public/
      const lines = vercelignore.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      const excludesAllPng = lines.some(line => line === '*.png');
      const excludesAllJpg = lines.some(line => line === '*.jpg');
      const excludesAllSvg = lines.some(line => line === '*.svg');
      expect(excludesAllPng).toBe(false);
      expect(excludesAllJpg).toBe(false);
      expect(excludesAllSvg).toBe(false);
    });

    it('should NOT exclude source code directories', () => {
      const lines = vercelignore.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      const excludesApp = lines.some(line => line === 'app' || line === 'app/');
      const excludesLib = lines.some(line => line === 'lib' || line === 'lib/');
      const excludesComponents = lines.some(line => line === 'components' || line === 'components/');
      expect(excludesApp).toBe(false);
      expect(excludesLib).toBe(false);
      expect(excludesComponents).toBe(false);
    });

    it('should exclude test files and directories', () => {
      const lines = vercelignore.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      expect(lines).toContain('__tests__');
      expect(lines).toContain('coverage');
    });

    it('should exclude backend directory', () => {
      const lines = vercelignore.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      expect(lines).toContain('backend');
    });
  });

  describe('vercel.json', () => {
    let vercelConfig: any;

    beforeAll(() => {
      const filepath = path.join(ROOT, 'vercel.json');
      vercelConfig = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    });

    it('should have a build command that runs prisma generate', () => {
      expect(vercelConfig.buildCommand).toContain('prisma');
      expect(vercelConfig.buildCommand).toContain('generate');
    });

    it('should have a build command that runs npm run build', () => {
      expect(vercelConfig.buildCommand).toContain('npm run build');
    });

    it('should use nextjs framework', () => {
      expect(vercelConfig.framework).toBe('nextjs');
    });

    it('should have .next as output directory', () => {
      expect(vercelConfig.outputDirectory).toBe('.next');
    });

    it('should configure API function max duration', () => {
      expect(vercelConfig.functions).toBeDefined();
      expect(vercelConfig.functions['app/api/**/*.ts']).toBeDefined();
      expect(vercelConfig.functions['app/api/**/*.ts'].maxDuration).toBeGreaterThanOrEqual(10);
    });
  });

  describe('next.config.js', () => {
    let nextConfig: any;

    beforeAll(() => {
      // Clear require cache to get fresh config
      const configPath = path.join(ROOT, 'next.config.js');
      delete require.cache[require.resolve(configPath)];
      nextConfig = require(configPath);
    });

    it('should NOT use standalone output mode', () => {
      // standalone is for Docker, not Vercel
      expect(nextConfig.output).not.toBe('standalone');
    });

    it('should have Cloudinary in image domains', () => {
      expect(nextConfig.images.domains).toContain('res.cloudinary.com');
    });

    it('should have production Vercel domain in image domains', () => {
      expect(nextConfig.images.domains).toContain('evo-fitness-trainer.vercel.app');
    });

    it('should not ignore TypeScript build errors', () => {
      expect(nextConfig.typescript.ignoreBuildErrors).toBe(false);
    });

    it('should have reactStrictMode enabled', () => {
      expect(nextConfig.reactStrictMode).toBe(true);
    });

    it('should not expose X-Powered-By header', () => {
      expect(nextConfig.poweredByHeader).toBe(false);
    });
  });

  describe('Critical static assets', () => {
    it('should have logo.svg in public/', () => {
      const logoPath = path.join(ROOT, 'public', 'logo.svg');
      expect(fs.existsSync(logoPath)).toBe(true);
    });

    it('should have logo.png in public/', () => {
      const logoPath = path.join(ROOT, 'public', 'logo.png');
      expect(fs.existsSync(logoPath)).toBe(true);
    });
  });

  describe('Service initialization safety', () => {
    it('tokenService should not throw at import time', () => {
      // The tokenService uses a Proxy for lazy initialization
      // Importing it should NOT throw even without JWT_ACCESS_SECRET
      expect(() => {
        const { tokenService } = require('../../lib/services/tokenService');
        expect(tokenService).toBeDefined();
      }).not.toThrow();
    });

    it('email service should not throw at import time', () => {
      expect(() => {
        const { sendPasswordResetEmail } = require('../../lib/services/email');
        expect(sendPasswordResetEmail).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('API routes have force-dynamic export', () => {
    const apiDir = path.join(ROOT, 'app', 'api');

    function findRouteFiles(dir: string): string[] {
      const results: string[] = [];
      if (!fs.existsSync(dir)) return results;
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          results.push(...findRouteFiles(fullPath));
        } else if (item.name === 'route.ts') {
          results.push(fullPath);
        }
      }
      return results;
    }

    it('all API route files should export dynamic = force-dynamic', () => {
      const routeFiles = findRouteFiles(apiDir);
      expect(routeFiles.length).toBeGreaterThan(0);

      const missingDynamic: string[] = [];
      for (const file of routeFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        if (!content.includes("export const dynamic = 'force-dynamic'")) {
          missingDynamic.push(path.relative(ROOT, file));
        }
      }

      expect(missingDynamic).toEqual([]);
    });
  });
});
