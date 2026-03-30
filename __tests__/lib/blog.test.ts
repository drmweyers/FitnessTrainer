/**
 * @jest-environment node
 */

import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

// Import blog after mock is set up
import { getAllPosts, getPostBySlug } from '@/lib/blog';

describe('lib/blog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPosts', () => {
    it('returns empty array when blog directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      expect(getAllPosts()).toEqual([]);
    });

    it('returns empty array when no markdown files exist', () => {
      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue([]);
      expect(getAllPosts()).toEqual([]);
    });

    it('parses a blog post with full frontmatter', () => {
      const content = `---
title: Test Post
slug: test-post
excerpt: A test excerpt
author: Jane Doe
date: 2026-01-15
category: Fitness
tags: [workout, strength]
readTime: 7
---
# Body Content
This is the body.`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['test-post.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(content);

      const posts = getAllPosts();

      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Test Post');
      expect(posts[0].slug).toBe('test-post');
      expect(posts[0].excerpt).toBe('A test excerpt');
      expect(posts[0].author).toBe('Jane Doe');
      expect(posts[0].category).toBe('Fitness');
      expect(posts[0].readTime).toBe(7);
      expect(posts[0].tags).toEqual(['workout', 'strength']);
    });

    it('uses filename as slug when slug is not in frontmatter', () => {
      const content = `---
title: No Slug Post
date: 2026-01-10
---
Body here.`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['my-post.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(content);

      const posts = getAllPosts();

      expect(posts[0].slug).toBe('my-post');
    });

    it('uses defaults for missing frontmatter fields', () => {
      const content = `---
title: Minimal Post
date: 2026-01-01
---
Body.`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['minimal.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(content);

      const posts = getAllPosts();

      expect(posts[0].author).toBe('EvoFit Team');
      expect(posts[0].category).toBe('General');
      expect(posts[0].readTime).toBe(5);
      expect(posts[0].tags).toEqual([]);
    });

    it('ignores non-markdown files', () => {
      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['post.md', 'image.png', 'notes.txt']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(`---\ntitle: Post\ndate: 2026-01-01\n---\nBody.`);

      const posts = getAllPosts();

      // Only the .md file should be read
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
      expect(posts).toHaveLength(1);
    });

    it('sorts posts by date descending', () => {
      const post1 = `---\ntitle: Older Post\ndate: 2026-01-01\n---\nOld.`;
      const post2 = `---\ntitle: Newer Post\ndate: 2026-03-15\n---\nNew.`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['older.md', 'newer.md']);
      (mockFs.readFileSync as jest.Mock)
        .mockReturnValueOnce(post1)
        .mockReturnValueOnce(post2);

      const posts = getAllPosts();

      expect(posts[0].title).toBe('Newer Post');
      expect(posts[1].title).toBe('Older Post');
    });

    it('handles post with no frontmatter delimiter', () => {
      const content = `Just plain content with no frontmatter`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['no-fm.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(content);

      const posts = getAllPosts();

      expect(posts).toHaveLength(1);
      expect(posts[0].content).toBe(content);
      expect(posts[0].title).toBe('');
    });

    it('handles tags array in frontmatter', () => {
      const content = `---\ntitle: Tagged\ndate: 2026-01-01\ntags: [fitness, nutrition, recovery]\n---\nContent.`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['tagged.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(content);

      const posts = getAllPosts();

      expect(posts[0].tags).toEqual(['fitness', 'nutrition', 'recovery']);
    });

    it('returns empty tags when tags field missing', () => {
      const content = `---\ntitle: No Tags\ndate: 2026-01-01\n---\nContent.`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['no-tags.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(content);

      const posts = getAllPosts();

      expect(posts[0].tags).toEqual([]);
    });

    it('returns content body (text after frontmatter)', () => {
      const body = '# Heading\nThis is the body content.\n\nSecond paragraph.';
      const content = `---\ntitle: Content Test\ndate: 2026-01-01\n---\n${body}`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['content-test.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(content);

      const posts = getAllPosts();

      expect(posts[0].content).toBe(body);
    });
  });

  describe('getPostBySlug', () => {
    it('returns the post matching the slug', () => {
      const content = `---\ntitle: Found Post\nslug: found-post\ndate: 2026-01-01\n---\nBody.`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['found-post.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(content);

      const post = getPostBySlug('found-post');

      expect(post).toBeDefined();
      expect(post?.title).toBe('Found Post');
      expect(post?.slug).toBe('found-post');
    });

    it('returns undefined when slug not found', () => {
      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue([]);

      const post = getPostBySlug('non-existent');

      expect(post).toBeUndefined();
    });

    it('returns undefined when blog dir does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const post = getPostBySlug('any-slug');

      expect(post).toBeUndefined();
    });

    it('finds post by filename-derived slug when no explicit slug', () => {
      const content = `---\ntitle: File Slug Post\ndate: 2026-01-01\n---\nBody.`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['file-slug-post.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(content);

      const post = getPostBySlug('file-slug-post');

      expect(post).toBeDefined();
      expect(post?.title).toBe('File Slug Post');
    });
  });
});
