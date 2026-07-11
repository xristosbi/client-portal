import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders trusted (admin-authored) markdown with the site's typography.
 * Usable from both server and client components.
 */
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-gold prose-strong:text-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
