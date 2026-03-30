/** @jest-environment node */

import { getAllPosts, getPostBySlug } from '@/lib/blog';
import fs from 'fs';
import path from 'path';

jest.mock('fs');
jest.mock('path');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

// Mock process.cwd()
const CWD = '/mock/project';
jest.spyOn(process, 'cwd').mockReturnValue(CWD);

const BLOG_DIR = `${CWD}/content/blog`;

beforeEach(() => {
  jest.clearAllMocks();
  // Default: path.join just concatenates with /
  mockedPath.join.mockImplementation((...parts: string[]) => parts.join('/'));
});

const sampleMdFile = `---
title: Test Post
slug: test-post
excerpt: A test excerpt
author: John Doe
date: 2026-01-15
category: Fitness
tags: [strength, cardio]
readTime: 7
---
# Test Post Content

This is the body of the test post.
`;

const noFrontmatterFile = `Just raw content without frontmatter`;

describe('getAllPosts', () => {
  it('returns empty array when blog directory does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);
    const result = getAllPosts();
    expect(result).toEqual([]);
  });

  it('returns empty array when no markdown files in directory', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['image.png', 'notes.txt'] as any);
    const result = getAllPosts();
    expect(result).toEqual([]);
  });

  it('parses a single markdown file with frontmatter', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['test-post.md'] as any);
    mockedFs.readFileSync.mockReturnValue(sampleMdFile);

    const result = getAllPosts();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Test Post');
    expect(result[0].slug).toBe('test-post');
    expect(result[0].excerpt).toBe('A test excerpt');
    expect(result[0].author).toBe('John Doe');
    expect(result[0].category).toBe('Fitness');
    expect(result[0].readTime).toBe(7);
  });

  it('parses tags array from frontmatter', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['test-post.md'] as any);
    mockedFs.readFileSync.mockReturnValue(sampleMdFile);

    const result = getAllPosts();
    expect(result[0].tags).toEqual(['strength', 'cardio']);
  });

  it('extracts body content correctly', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['test-post.md'] as any);
    mockedFs.readFileSync.mockReturnValue(sampleMdFile);

    const result = getAllPosts();
    expect(result[0].content).toContain('Test Post Content');
    expect(result[0].content).toContain('body of the test post');
  });

  it('uses filename as slug fallback when slug not in frontmatter', () => {
    const mdWithoutSlug = `---
title: No Slug Post
---
Content here`;
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['no-slug-post.md'] as any);
    mockedFs.readFileSync.mockReturnValue(mdWithoutSlug);

    const result = getAllPosts();
    expect(result[0].slug).toBe('no-slug-post');
  });

  it('uses defaults when frontmatter fields are missing', () => {
    const minimal = `---
title: Minimal Post
---
Body`;
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['minimal.md'] as any);
    mockedFs.readFileSync.mockReturnValue(minimal);

    const result = getAllPosts();
    expect(result[0].author).toBe('EvoFit Team');
    expect(result[0].category).toBe('General');
    expect(result[0].tags).toEqual([]);
    expect(result[0].readTime).toBe(5);
    expect(result[0].excerpt).toBe('');
  });

  it('handles file without frontmatter delimiters', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['raw.md'] as any);
    mockedFs.readFileSync.mockReturnValue(noFrontmatterFile);

    const result = getAllPosts();
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe(noFrontmatterFile);
  });

  it('sorts posts by date descending (newest first)', () => {
    const post1 = `---
title: Older Post
date: 2026-01-01
---
Old`;
    const post2 = `---
title: Newer Post
date: 2026-03-01
---
New`;
    const post3 = `---
title: Middle Post
date: 2026-02-01
---
Mid`;

    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['post1.md', 'post2.md', 'post3.md'] as any);
    mockedFs.readFileSync
      .mockReturnValueOnce(post1)
      .mockReturnValueOnce(post2)
      .mockReturnValueOnce(post3);

    const result = getAllPosts();
    expect(result[0].title).toBe('Newer Post');
    expect(result[1].title).toBe('Middle Post');
    expect(result[2].title).toBe('Older Post');
  });

  it('handles colon in frontmatter value', () => {
    const mdWithColon = `---
title: Post: With Colon
---
Body`;
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['post.md'] as any);
    mockedFs.readFileSync.mockReturnValue(mdWithColon);

    const result = getAllPosts();
    expect(result[0].title).toBe('Post: With Colon');
  });

  it('handles quoted frontmatter values', () => {
    const mdWithQuotes = `---
title: "Quoted Title"
author: 'Single Quoted Author'
---
Body`;
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['post.md'] as any);
    mockedFs.readFileSync.mockReturnValue(mdWithQuotes);

    const result = getAllPosts();
    expect(result[0].title).toBe('Quoted Title');
  });

  it('reads files only with .md extension', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['post.md', 'readme.txt', 'image.jpg', 'other.md'] as any);
    mockedFs.readFileSync.mockReturnValue(`---\ntitle: T\n---\nB`);

    getAllPosts();
    expect(mockedFs.readFileSync).toHaveBeenCalledTimes(2);
  });
});

describe('getPostBySlug', () => {
  it('returns post matching the slug', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['test-post.md'] as any);
    mockedFs.readFileSync.mockReturnValue(sampleMdFile);

    const result = getPostBySlug('test-post');
    expect(result).not.toBeUndefined();
    expect(result!.slug).toBe('test-post');
    expect(result!.title).toBe('Test Post');
  });

  it('returns undefined for non-existent slug', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['test-post.md'] as any);
    mockedFs.readFileSync.mockReturnValue(sampleMdFile);

    const result = getPostBySlug('nonexistent-slug');
    expect(result).toBeUndefined();
  });

  it('returns undefined when no blog posts exist', () => {
    mockedFs.existsSync.mockReturnValue(false);

    const result = getPostBySlug('any-slug');
    expect(result).toBeUndefined();
  });
});
