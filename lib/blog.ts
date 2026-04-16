import fs from "fs";
import path from "path";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  tags: string[];
  readTime: number;
}

const BLOG_DIR = path.join(process.cwd(), "content/blog");

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };

  const frontmatter: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();

    // Handle arrays like [tag1, tag2]
    if (val.startsWith("[") && val.endsWith("]")) {
      frontmatter[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim());
    } else {
      frontmatter[key] = val.replace(/^['"]|['"]$/g, "");
    }
  }

  return { frontmatter, body: match[2] };
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
      const { frontmatter, body } = parseFrontmatter(raw);

      return {
        slug: (frontmatter.slug as string) || file.replace(".md", ""),
        title: (frontmatter.title as string) || "",
        excerpt: (frontmatter.excerpt as string) || "",
        content: body,
        author: (frontmatter.author as string) || "EvoFit Team",
        date: String(frontmatter.date || ""),
        category: (frontmatter.category as string) || "General",
        tags: (frontmatter.tags as string[]) || [],
        readTime: Number(frontmatter.readTime) || 5,
      } as BlogPost;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}
