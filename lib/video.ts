export type VideoEmbed =
  | { kind: "youtube" | "vimeo" | "loom"; embedUrl: string }
  | { kind: "file"; url: string };

/** Detects the provider from a URL and returns how to render it. */
export function parseVideoUrl(rawUrl: string): VideoEmbed | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtube.com") {
    if (url.pathname.startsWith("/embed/")) {
      return { kind: "youtube", embedUrl: url.toString() };
    }
    const videoId = url.searchParams.get("v");
    if (videoId) {
      return {
        kind: "youtube",
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    }
    const shortsMatch = url.pathname.match(/^\/shorts\/([\w-]+)/);
    if (shortsMatch) {
      return {
        kind: "youtube",
        embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}`,
      };
    }
    return null;
  }

  if (host === "youtu.be") {
    const videoId = url.pathname.slice(1);
    return videoId
      ? {
          kind: "youtube",
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        }
      : null;
  }

  if (host === "vimeo.com") {
    const match = url.pathname.match(/^\/(\d+)/);
    return match
      ? { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${match[1]}` }
      : null;
  }

  if (host === "player.vimeo.com") {
    return { kind: "vimeo", embedUrl: url.toString() };
  }

  if (host === "loom.com") {
    const match = url.pathname.match(/^\/(?:share|embed)\/([\w-]+)/);
    return match
      ? { kind: "loom", embedUrl: `https://www.loom.com/embed/${match[1]}` }
      : null;
  }

  // Anything else is treated as a direct video file URL.
  return { kind: "file", url: url.toString() };
}
