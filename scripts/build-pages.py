from pathlib import Path
from urllib.parse import quote, unquote
import hashlib
import os
import re
import shutil
import subprocess
import tempfile
import unicodedata
from typing import Optional

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = Path(
    os.environ.get(
        "SITE_OUTPUT",
        Path(tempfile.gettempdir()) / "yuuportfolio-site",
    )
).expanduser().resolve()
FAVICON = ROOT / "favicon.png"
SITE_BASE = "/yuuportfolio/"
MEDIA_ROUTE = SITE_BASE + "__media__/"
MEDIA_UPSTREAM_BASE = (
    "https://media.githubusercontent.com/media/"
    "2yuuki/yuuportfolio/main/"
)
BUNDLED_VIDEO_MAX_BYTES = 50 * 1024 * 1024
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


def tracked_repository_paths() -> set[str]:
    try:
        output = subprocess.check_output(
            ["git", "ls-files", "-z"],
            cwd=ROOT,
        ).decode("utf-8")
    except (OSError, subprocess.CalledProcessError, UnicodeDecodeError):
        return set()
    return {path for path in output.split("\0") if path}


TRACKED_PATHS = tracked_repository_paths()
TRACKED_PATHS_BY_NFC: dict[str, list[str]] = {}
for tracked_path in TRACKED_PATHS:
    TRACKED_PATHS_BY_NFC.setdefault(
        unicodedata.normalize("NFC", tracked_path),
        [],
    ).append(tracked_path)


def is_excluded(path: Path) -> bool:
    return any(part in EXCLUDED_PARTS for part in path.relative_to(ROOT).parts)


def resolve_local_reference(html_file: Path, path_value: str) -> Path:
    decoded = unquote(path_value)
    candidates = [
        decoded,
        unicodedata.normalize("NFD", decoded),
        unicodedata.normalize("NFC", decoded),
    ]
    for candidate in dict.fromkeys(candidates):
        resolved = (html_file.parent / candidate).resolve()
        if resolved.exists():
            return resolved
    return (html_file.parent / decoded).resolve()


def repository_path_for(relative: Path) -> str:
    local_path = relative.as_posix()
    if local_path in TRACKED_PATHS:
        return local_path

    normalized_path = unicodedata.normalize("NFC", local_path)
    matches = TRACKED_PATHS_BY_NFC.get(normalized_path, [])
    if matches:
        return matches[0]
    return normalized_path


def lfs_pointer_size(path: Path) -> Optional[int]:
    try:
        with path.open("rb") as source:
            header = source.read(256)
    except OSError:
        return None
    if not header.startswith(b"version https://git-lfs.github.com/spec/v1"):
        return None
    match = re.search(rb"(?:^|\n)size (\d+)(?:\n|$)", header)
    return int(match.group(1)) if match else None


def media_file_size(path: Path) -> int:
    pointer_size = lfs_pointer_size(path)
    return pointer_size if pointer_size is not None else path.stat().st_size


def should_bundle_media(path: Path) -> bool:
    return (
        path.suffix.lower() in {".mp4", ".mov"} and
        media_file_size(path) <= BUNDLED_VIDEO_MAX_BYTES
    )


def bundle_media(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if lfs_pointer_size(source) is None:
        shutil.copy2(source, destination)
        return

    pointer = source.read_bytes()
    relative = source.relative_to(ROOT).as_posix()
    with destination.open("wb") as output:
        subprocess.run(
            ["git", "lfs", "smudge", relative],
            cwd=ROOT,
            input=pointer,
            stdout=output,
            check=True,
        )


def referenced_bundled_media() -> set[str]:
    referenced = set()
    for html_file in ROOT.rglob("*.html"):
        if is_excluded(html_file):
            continue
        text = html_file.read_text(encoding="utf-8")
        for match in REFERENCE_PATTERN.finditer(text):
            value = match.group("value")
            if value.startswith((
                "http://", "https://", "//", "#", "mailto:", "javascript:"
            )):
                continue
            path_value = value.split("#", 1)[0].split("?", 1)[0]
            resolved = resolve_local_reference(html_file, path_value)
            if resolved.exists() and should_bundle_media(resolved):
                referenced.add(repository_path_for(resolved.relative_to(ROOT)))
    return referenced


def rewrite_reference(html_file: Path, value: str) -> str:
    if value.startswith(("http://", "https://", "//", "#", "mailto:", "javascript:")):
        return value

    path_value = value.split("#", 1)[0].split("?", 1)[0]
    suffix = value[len(path_value):]
    resolved = resolve_local_reference(html_file, path_value)

    try:
        relative = resolved.relative_to(ROOT)
    except ValueError:
        return value

    if resolved.suffix.lower() not in MEDIA_EXTENSIONS:
        return value

    repository_path = repository_path_for(relative)
    if should_bundle_media(resolved):
        return (
            SITE_BASE +
            quote(repository_path, safe="/()") +
            suffix
        )
    return (
        MEDIA_UPSTREAM_BASE +
        quote(repository_path, safe="/()") +
        suffix
    )


def rewrite_match(html_file: Path, match: re.Match) -> str:
    attr = match.group("attr").lower()
    quote_char = match.group("quote")
    original = match.group("value")
    rewritten = rewrite_reference(html_file, original)

    if rewritten == original:
        return match.group(0)

    if attr == "src":
        resolved = resolve_local_reference(
            html_file,
            original.split("#", 1)[0].split("?", 1)[0],
        )
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
    return """(() => {
  const loadElement = (element) => {
    if (element.dataset.mediaSrc) {
      element.src = element.dataset.mediaSrc;
      element.removeAttribute("data-media-src");
      if (element.tagName === "VIDEO") {
        element.preload = "none";
        element.load();
        if (element.dataset.autoplay === "true") {
          element.play().catch(() => {});
        }
      }
    }
    if (element.dataset.mediaPoster) {
      element.poster = element.dataset.mediaPoster;
      element.removeAttribute("data-media-poster");
    }
  };

  const observeMedia = () => {
    const media = Array.from(document.querySelectorAll(
      "[data-media-src], [data-media-poster]"
    ));
    if (!media.length) return;

    if (!("IntersectionObserver" in window)) {
      media.forEach(loadElement);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          loadElement(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "300px 0px", threshold: 0.01 }
    );
    media.forEach((element) => observer.observe(element));
  };

  observeMedia();
})();
"""


def gallery_autoplay_source() -> str:
    return (ROOT / "gallery-autoplay.js").read_text(encoding="utf-8")


def build() -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)

    gallery_autoplay = gallery_autoplay_source()
    gallery_autoplay_version = hashlib.sha256(
        gallery_autoplay.encode("utf-8")
    ).hexdigest()[:12]
    stylesheet_version = hashlib.sha256(
        (ROOT / "style.css").read_bytes()
    ).hexdigest()[:12]
    image_zoom_version = hashlib.sha256(
        (ROOT / "image-zoom.js").read_bytes()
    ).hexdigest()[:12]
    media_loader = media_loader_source()
    media_loader_version = hashlib.sha256(
        media_loader.encode("utf-8")
    ).hexdigest()[:12]
    bundled_media = referenced_bundled_media()

    for source in ROOT.rglob("*"):
        if not source.is_file() or is_excluded(source):
            continue

        relative = source.relative_to(ROOT)
        destination = OUTPUT / relative

        if source.suffix.lower() in MEDIA_EXTENSIONS:
            repository_path = repository_path_for(relative)
            if repository_path in bundled_media:
                destination = OUTPUT / repository_path
                bundle_media(source, destination)
            continue

        destination.parent.mkdir(parents=True, exist_ok=True)

        if source.suffix.lower() == ".html":
            text = source.read_text(encoding="utf-8")
            text = re.sub(
                r'(?P<prefix>\bhref=["\'][^"\']*style\.css)'
                r'(?:\?[^"\']*)?(?P<quote>["\'])',
                (
                    rf'\g<prefix>?v={stylesheet_version}'
                    rf'\g<quote>'
                ),
                text,
                flags=re.IGNORECASE,
            )
            text = re.sub(
                r'(?P<prefix>\bsrc=["\'][^"\']*image-zoom\.js)'
                r'(?:\?[^"\']*)?(?P<quote>["\'])',
                (
                    rf'\g<prefix>?v={image_zoom_version}'
                    rf'\g<quote>'
                ),
                text,
                flags=re.IGNORECASE,
            )
            text = text.replace(
                "Ti%CC%80nh%20Ca",
                "T%C3%ACnh%20Ca",
            )
            text = REFERENCE_PATTERN.sub(
                lambda match: rewrite_match(source, match),
                text,
            )
            loader_tag = (
                (
                    f'<script src="{SITE_BASE}media-loader.js'
                    f'?v={media_loader_version}" defer></script>'
                )
            )
            gallery_autoplay_tag = (
                (
                    f'<script src="{SITE_BASE}gallery-autoplay.js'
                    f'?v={gallery_autoplay_version}" defer></script>'
                )
            )
            favicon_tag = (
                f'<link rel="icon" type="image/png" href="{SITE_BASE}favicon.png">'
            )
            if "</head>" in text:
                runtime_tags = f"{loader_tag}\n"
                if "gallery-autoplay.js" not in text:
                    runtime_tags += f"{gallery_autoplay_tag}\n"
                text = text.replace(
                    "</head>",
                    (
                        f"{favicon_tag}\n"
                        f"{runtime_tags}"
                        "</head>"
                    ),
                    1,
                )
            else:
                runtime_tags = loader_tag + "\n"
                if "gallery-autoplay.js" not in text:
                    runtime_tags += gallery_autoplay_tag + "\n"
                text = (
                    favicon_tag + "\n" +
                    runtime_tags +
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
        media_loader,
        encoding="utf-8",
    )
    (OUTPUT / "gallery-autoplay.js").write_text(
        gallery_autoplay,
        encoding="utf-8",
    )


if __name__ == "__main__":
    build()
