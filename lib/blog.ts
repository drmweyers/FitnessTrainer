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
  const lines = match[1].split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) { i++; continue; }
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();

    // Nested object block (e.g. SmartSocial's `author:\n  name: "..."`)
    if (val === "" && i + 1 < lines.length && lines[i + 1].startsWith("  ")) {
      const sub: Record<string, string> = {};
      i++;
      while (i < lines.length && lines[i].startsWith("  ")) {
        const subColon = lines[i].indexOf(":");
        if (subColon !== -1) {
          const subKey = lines[i].slice(0, subColon).trim();
          const subVal = lines[i].slice(subColon + 1).trim().replace(/^['"]|['"]$/g, "");
          sub[subKey] = subVal;
        }
        i++;
      }
      frontmatter[key] = sub;
      continue;
    }

    // Array: [tag1, tag2] or ["tag1", "tag2"]
    if (val.startsWith("[") && val.endsWith("]")) {
      frontmatter[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    } else {
      frontmatter[key] = val.replace(/^['"]|['"]$/g, "");
    }
    i++;
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

      // Support both flat `author: "Name"` and SmartSocial nested `author: { name: "Name" }`
      const rawAuthor = frontmatter.author;
      const author =
        typeof rawAuthor === "object" && rawAuthor !== null
          ? ((rawAuthor as Record<string, string>).name ?? "EvoFit Team")
          : (rawAuthor as string) || "EvoFit Team";

      // Support both `date:` and SmartSocial's `published_at:`
      const date = String(frontmatter.date || frontmatter.published_at || "").slice(0, 10);

      return {
        slug: (frontmatter.slug as string) || file.replace(".md", ""),
        title: (frontmatter.title as string) || "",
        excerpt: (frontmatter.excerpt as string) || "",
        content: body,
        author,
        date,
        category: (frontmatter.category as string) || "Fitness",
        tags: (frontmatter.tags as string[]) || [],
        readTime: Number(frontmatter.readTime) || 5,
      } as BlogPost;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}
