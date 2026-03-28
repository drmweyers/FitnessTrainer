import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "EvoFit Trainer Blog | Workout Programming & Coaching Education",
  description:
    "Evidence-based articles on workout programming, periodization, client management, and strength coaching — from the EvoFit Trainer team.",
  openGraph: {
    title: "EvoFit Trainer Blog",
    description:
      "Evidence-based articles on workout programming, periodization, client management, and strength coaching.",
    type: "website",
    siteName: "EvoFit Trainer",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-blue-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">EvoFit Trainer Blog</h1>
          <p className="text-xl text-blue-100">
            Evidence-based articles on workout programming, periodization, and coaching education.
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-20">No posts yet — check back soon.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden cursor-pointer">
                  <div className="bg-blue-50 px-5 py-3">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 leading-snug hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {new Date(post.date).toLocaleDateString("en-CA", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span>{post.readTime} min read</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
