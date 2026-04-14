import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Post Not Found | EvoFit Trainer" };

  return {
    title: `${post.title} | EvoFit Trainer Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      siteName: "EvoFit Trainer",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

// Simple markdown renderer (no external deps needed)
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, "<hr />")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(
      /^\|(.+)\|$/gm,
      (match) => {
        if (match.includes("---")) return "";
        const cells = match
          .slice(1, -1)
          .split("|")
          .map((c) => `<td>${c.trim()}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      }
    )
    .replace(/\n\n/g, "</p><p>");
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const htmlContent = renderMarkdown(post.content);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/blog" className="hover:text-blue-600">
            Blog
          </Link>{" "}
          / <span className="text-gray-700">{post.title}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-10">
          <span className="bg-blue-50 text-blue-600 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
            {post.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>{post.author}</span>
            <span>·</span>
            <span>
              {new Date(post.date).toLocaleDateString("en-CA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span>·</span>
            <span>{post.readTime} min read</span>
          </div>
        </header>

        {/* Content */}
        <article
          className="prose prose-blue max-w-none"
          dangerouslySetInnerHTML={{ __html: `<p>${htmlContent}</p>` }}
        />

        {/* Tags */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Ready to build better programs?
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            EvoFit Trainer gives you a 1,324-exercise library, multi-week program builder, and
            client management — all in one platform.
          </p>
          <Link
            href="/register"
            className="inline-block bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Free Trial →
          </Link>
        </div>

        <div className="mt-8">
          <Link href="/blog" className="text-blue-600 hover:underline text-sm">
            ← Back to Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
