from pathlib import Path
from urllib.parse import quote, unquote
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
FAVICON = ROOT / "favicon.png"
SITE_BASE = "/yuuportfolio/"
MEDIA_ROUTE = SITE_BASE + "__media__/"
MEDIA_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".mp4", ".mov", ".pdf", ".docx"
}
EXCLUDED_PARTS = {".git", ".github", ".openai", "_site", "scripts"}
REFERENCE_PATTERN = re.compile(
    r"(?P<attr>\b(?:src|href|poster))=(?P<quote>[\"'])(?P<value>[^\"']+)(?P=quote)",
    re.IGNORECASE,
)
TRANSPARENT_IMAGE = (
    "data:image/gif;base64,"
    "R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
)

MEDIA_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def is_excluded(path: Path) -> bool:
    return any(part in EXCLUDED_PARTS for part in path.relative_to(ROOT).parts)


def rewrite_reference(html_file: Path, value: str) -> str:
    if value.startswith(("http://", "https://", "//", "#", "mailto:", "javascript:")):
        return value

    path_value = value.split("#", 1)[0].split("?", 1)[0]
    resolved = (html_file.parent / unquote(path_value)).resolve()

    try:
        relative = resolved.relative_to(ROOT)
    except ValueError:
        return value

    if resolved.suffix.lower() not in MEDIA_EXTENSIONS:
        return value

    return MEDIA_ROUTE + quote(relative.as_posix(), safe="/()")


def rewrite_match(html_file: Path, match: re.Match) -> str:
    attr = match.group("attr").lower()
    quote_char = match.group("quote")
    original = match.group("value")
    rewritten = rewrite_reference(html_file, original)

    if rewritten == original:
        return match.group(0)

    if attr == "src":
        resolved = (html_file.parent / unquote(
            original.split("#", 1)[0].split("?", 1)[0]
        )).resolve()
        placeholder = TRANSPARENT_IMAGE if resolved.suffix.lower() in {
            ".png", ".jpg", ".jpeg", ".gif"
        } else ""
        return (
            f'src={quote_char}{placeholder}{quote_char} '
            f'data-media-src={quote_char}{rewritten}{quote_char}'
        )

    if attr == "poster":
        return (
            f'poster={quote_char}{TRANSPARENT_IMAGE}{quote_char} '
            f'data-media-poster={quote_char}{rewritten}{quote_char}'
        )

    return f'href={quote_char}{rewritten}{quote_char}'


def service_worker_source() -> str:
    media_types = ",\n".join(
        f'  "{extension}": "{mime_type}"'
        for extension, mime_type in MEDIA_TYPES.items()
    )
    return f"""const MEDIA_PREFIX = "{MEDIA_ROUTE}";
const UPSTREAM_BASE =
  "https://media.githubusercontent.com/media/2yuuki/yuuportfolio/main/";
const MEDIA_TYPES = {{
{media_types}
}};
const TOTAL_LENGTHS = new Map();

async function getTotalLength(upstreamUrl) {{
  if (TOTAL_LENGTHS.has(upstreamUrl)) return TOTAL_LENGTHS.get(upstreamUrl);

  const response = await fetch(upstreamUrl, {{
    method: "HEAD",
    mode: "cors",
  }});
  const totalLength = Number(response.headers.get("content-length")) || 0;
  if (totalLength) TOTAL_LENGTHS.set(upstreamUrl, totalLength);
  return totalLength;
}}

function getRangeStart(range, totalLength) {{
  const match = range && range.match(/^bytes=(\\d*)-(\\d*)$/);
  if (!match) return null;

  if (match[1]) return Number(match[1]);
  if (match[2] && totalLength) {{
    return Math.max(totalLength - Number(match[2]), 0);
  }}
  return null;
}}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {{
  event.waitUntil(self.clients.claim());
}});

self.addEventListener("fetch", (event) => {{
  const requestUrl = new URL(event.request.url);
  if (!requestUrl.pathname.startsWith(MEDIA_PREFIX)) return;

  event.respondWith((async () => {{
    const encodedPath = requestUrl.pathname.slice(MEDIA_PREFIX.length);
    const upstreamUrl = UPSTREAM_BASE + encodedPath + requestUrl.search;
    const requestHeaders = new Headers();
    const range = event.request.headers.get("range");
    if (range) requestHeaders.set("range", range);

    const upstream = await fetch(upstreamUrl, {{
      method: "GET",
      headers: requestHeaders,
      mode: "cors",
    }});
    const responseLength =
      Number(upstream.headers.get("content-length")) || 0;

    const extensionMatch = decodeURIComponent(requestUrl.pathname)
      .toLowerCase()
      .match(/\\.[a-z0-9]+$/);
    const extension = extensionMatch ? extensionMatch[0] : "";
    const responseHeaders = new Headers();

    responseHeaders.set(
      "content-type",
      MEDIA_TYPES[extension] || upstream.headers.get("content-type") ||
        "application/octet-stream"
    );
    for (const header of [
      "accept-ranges",
      "content-length",
      "etag",
      "last-modified",
    ]) {{
      const value = upstream.headers.get(header);
      if (value) responseHeaders.set(header, value);
    }}

    if (range && upstream.status === 206 && responseLength) {{
      const totalLength = await getTotalLength(upstreamUrl);
      const rangeStart = getRangeStart(range, totalLength);
      if (rangeStart !== null && totalLength) {{
        const rangeEnd = rangeStart + responseLength - 1;
        responseHeaders.set(
          "content-range",
          `bytes ${{rangeStart}}-${{rangeEnd}}/${{totalLength}}`
        );
        responseHeaders.set("accept-ranges", "bytes");
      }}
    }}
    responseHeaders.set("cache-control", "public, max-age=31536000, immutable");

    return new Response(upstream.body, {{
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    }});
  }})());
}});
"""


def media_loader_source() -> str:
    return f"""(() => {{
  const loadMedia = () => {{
    document.querySelectorAll("[data-media-src]").forEach((element) => {{
      element.src = element.dataset.mediaSrc;
      element.removeAttribute("data-media-src");
      if (element.tagName === "VIDEO") element.load();
    }});
    document.querySelectorAll("[data-media-poster]").forEach((element) => {{
      element.poster = element.dataset.mediaPoster;
      element.removeAttribute("data-media-poster");
    }});
  }};

  if (!("serviceWorker" in navigator)) {{
    loadMedia();
    return;
  }}

  navigator.serviceWorker
    .register("{SITE_BASE}media-sw.js", {{ scope: "{SITE_BASE}" }})
    .then(() => navigator.serviceWorker.ready)
    .then(() => {{
      if (navigator.serviceWorker.controller) {{
        loadMedia();
        return;
      }}

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        loadMedia,
        {{ once: true }}
      );
    }})
    .catch(loadMedia);
}})();
"""


def gallery_autoplay_source() -> str:
    return """(() => {
  const AUTOPLAY_DELAY = 300;

  const activateMedia = (slide, active) => {
    slide.style.display = active ? "block" : "none";
    slide.querySelectorAll("video").forEach((video) => {
      if (active) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  };

  document.querySelectorAll("gallery-slideshow").forEach((gallery) => {
    const slides = Array.from(gallery.children).filter(
      (child) => child.tagName === "MEDIA-ITEM"
    );
    if (slides.length < 2) return;

    let index = 0;
    slides.forEach((slide, slideIndex) => {
      activateMedia(slide, slideIndex === index);
    });

    window.setInterval(() => {
      index = (index + 1) % slides.length;
      slides.forEach((slide, slideIndex) => {
        activateMedia(slide, slideIndex === index);
      });
    }, AUTOPLAY_DELAY);
  });

  const startScrollingGallery = (viewport, slides) => {
    if (!viewport || slides.length < 2) return;

    let index = 0;
    window.setInterval(() => {
      index = (index + 1) % slides.length;
      viewport.scrollTo({
        left: index * viewport.clientWidth,
        behavior: "smooth",
      });
    }, AUTOPLAY_DELAY);
  };

  document.querySelectorAll("[data-memory-slider]").forEach((gallery) => {
    const viewport = gallery.querySelector("[data-slider-track]");
    const slides = Array.from(
      gallery.querySelectorAll(".memory-output-slider__slide")
    );
    startScrollingGallery(viewport, slides);
  });

  document
    .querySelectorAll("[data-project-horizontal-gallery]")
    .forEach((gallery) => {
      const viewport = gallery.querySelector(
        ".project-horizontal-gallery__viewport"
      );
      const slides = Array.from(
        gallery.querySelectorAll(".project-horizontal-gallery__slide")
      );
      startScrollingGallery(viewport, slides);
    });

  document.querySelectorAll("[data-horizontal-gallery]").forEach((gallery) => {
    const viewport = gallery.querySelector(
      ".homepage-horizontal-gallery__viewport"
    );
    const slides = Array.from(
      gallery.querySelectorAll(".homepage-horizontal-gallery__slide")
    );
    startScrollingGallery(viewport, slides);
  });

  document.querySelectorAll(".project-card__rotator").forEach((rotator) => {
    const slides = Array.from(rotator.querySelectorAll("img"));
    if (slides.length < 2) return;

    let index = 0;
    slides.forEach((slide, slideIndex) => {
      slide.style.animation = "none";
      slide.style.opacity = slideIndex === index ? "1" : "0";
    });

    window.setInterval(() => {
      index = (index + 1) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.style.opacity = slideIndex === index ? "1" : "0";
      });
    }, AUTOPLAY_DELAY);
  });
})();
"""


def build() -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)

    for source in ROOT.rglob("*"):
        if not source.is_file() or is_excluded(source):
            continue

        relative = source.relative_to(ROOT)
        destination = OUTPUT / relative

        if source.suffix.lower() in MEDIA_EXTENSIONS:
            continue

        destination.parent.mkdir(parents=True, exist_ok=True)

        if source.suffix.lower() == ".html":
            text = source.read_text(encoding="utf-8")
            text = text.replace(
                "Ti%CC%80nh%20Ca",
                "T%C3%ACnh%20Ca",
            )
            text = REFERENCE_PATTERN.sub(
                lambda match: rewrite_match(source, match),
                text,
            )
            loader_tag = (
                f'<script src="{SITE_BASE}media-loader.js" defer></script>'
            )
            gallery_autoplay_tag = (
                f'<script src="{SITE_BASE}gallery-autoplay.js" defer></script>'
            )
            favicon_tag = (
                f'<link rel="icon" type="image/png" href="{SITE_BASE}favicon.png">'
            )
            if "</head>" in text:
                text = text.replace(
                    "</head>",
                    (
                        f"{favicon_tag}\n"
                        f"{loader_tag}\n"
                        f"{gallery_autoplay_tag}\n"
                        "</head>"
                    ),
                    1,
                )
            else:
                text = (
                    favicon_tag + "\n" +
                    loader_tag + "\n" +
                    gallery_autoplay_tag + "\n" +
                    text
                )
            destination.write_text(text, encoding="utf-8")
        else:
            shutil.copy2(source, destination)

    if FAVICON.exists():
        shutil.copy2(FAVICON, OUTPUT / "favicon.png")

    (OUTPUT / ".nojekyll").touch()
    (OUTPUT / "media-sw.js").write_text(
        service_worker_source(),
        encoding="utf-8",
    )
    (OUTPUT / "media-loader.js").write_text(
        media_loader_source(),
        encoding="utf-8",
    )
    (OUTPUT / "gallery-autoplay.js").write_text(
        gallery_autoplay_source(),
        encoding="utf-8",
    )


if __name__ == "__main__":
    build()
