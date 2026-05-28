import { describe, it, expect } from "vitest";
import { extractYoutubeId } from "@/lib/utils";
import { parseTranscriptXml, extractCaptionTracksFromHtml } from "@/lib/youtube-transcript";

describe("extractYoutubeId()", () => {
  it("extracts from watch URL", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from watch URL with extra params", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=abc&index=1")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from youtu.be short link", () => {
    expect(extractYoutubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from youtu.be with tracking param", () => {
    expect(extractYoutubeId("https://youtu.be/dQw4w9WgXcQ?si=abc123")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from YouTube Shorts", () => {
    expect(extractYoutubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from embed URL", () => {
    expect(extractYoutubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for non-YouTube URL", () => {
    expect(extractYoutubeId("https://vimeo.com/123456")).toBeNull();
  });

  it("returns null for plain text", () => {
    expect(extractYoutubeId("not-a-url")).toBeNull();
  });

  it("returns null for YouTube URL without video ID", () => {
    expect(extractYoutubeId("https://www.youtube.com/channel/UCxxx")).toBeNull();
  });
});

describe("parseTranscriptXml()", () => {
  it("parses basic timed text paragraphs", () => {
    const xml = `<transcript><p t="0" d="2000">Hello world</p><p t="2000" d="1500">How are you?</p></transcript>`;
    const items = parseTranscriptXml(xml);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ text: "Hello world", offset: 0, duration: 2000 });
    expect(items[1]).toEqual({ text: "How are you?", offset: 2000, duration: 1500 });
  });

  it("decodes HTML entities", () => {
    const xml = `<p t="0" d="1000">it&#39;s &amp; fine &lt;ok&gt;</p>`;
    const items = parseTranscriptXml(xml);
    expect(items[0].text).toBe("it's & fine <ok>");
  });

  it("strips XML tags inside text", () => {
    const xml = `<p t="0" d="1000"><s>Hello</s> <s>world</s></p>`;
    const items = parseTranscriptXml(xml);
    expect(items[0].text).toBe("Hello world");
  });

  it("skips empty text items", () => {
    const xml = `<p t="0" d="500">   </p><p t="500" d="1000">Hello</p>`;
    const items = parseTranscriptXml(xml);
    expect(items).toHaveLength(1);
    expect(items[0].text).toBe("Hello");
  });
});

describe("extractCaptionTracksFromHtml()", () => {
  it("returns null when ytInitialPlayerResponse is absent", () => {
    expect(extractCaptionTracksFromHtml("<html><body>no player here</body></html>")).toBeNull();
  });

  it("extracts English and French tracks", () => {
    const playerResponse = {
      playabilityStatus: { status: "OK" },
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            { languageCode: "en", baseUrl: "https://www.youtube.com/api/timedtext?lang=en" },
            { languageCode: "fr", baseUrl: "https://www.youtube.com/api/timedtext?lang=fr" },
          ],
        },
      },
    };
    const html = `<script>var ytInitialPlayerResponse = ${JSON.stringify(playerResponse)};</script>`;
    const tracks = extractCaptionTracksFromHtml(html);
    expect(tracks).toHaveLength(2);
    expect(tracks![0].languageCode).toBe("en");
    expect(tracks![1].languageCode).toBe("fr");
  });

  it("returns null when captions object is missing", () => {
    const playerResponse = { playabilityStatus: { status: "LOGIN_REQUIRED" } };
    const html = `var ytInitialPlayerResponse = ${JSON.stringify(playerResponse)};`;
    expect(extractCaptionTracksFromHtml(html)).toBeNull();
  });

  it("returns null when captionTracks array is empty", () => {
    const playerResponse = {
      captions: { playerCaptionsTracklistRenderer: { captionTracks: [] } },
    };
    const html = `var ytInitialPlayerResponse = ${JSON.stringify(playerResponse)};`;
    expect(extractCaptionTracksFromHtml(html)).toBeNull();
  });
});
