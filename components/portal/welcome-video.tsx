import { parseVideoUrl } from "@/lib/video";

export function WelcomeVideo({ url }: { url: string }) {
  const embed = parseVideoUrl(url);
  if (!embed) return null;

  if (embed.kind === "file") {
    return (
      <div className="overflow-hidden rounded-xl border bg-black">
        <video
          src={embed.url}
          controls
          preload="metadata"
          className="aspect-video w-full"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black">
      <iframe
        src={embed.embedUrl}
        title="Βίντεο καλωσορίσματος"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
