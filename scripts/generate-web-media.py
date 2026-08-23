from __future__ import annotations

from hashlib import sha1
from pathlib import Path
from urllib.parse import unquote
import json
import re
import shutil
import subprocess
import unicodedata

from PIL import Image, ImageOps, ImageSequence


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "web-media"
MANIFEST = ROOT / "assets" / "web-media-manifest.json"
EXCLUDED_PARTS = {
    ".git", ".github", ".openai", "_site", "scripts", "tmp",
    "_legacy_from_Yuu",
}
REFERENCE_PATTERN = re.compile(
    r"\b(?:src|poster)=(?P<quote>[\"'])(?P<value>[^\"']+)(?P=quote)",
    re.IGNORECASE,
)
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
VIDEO_EXTENSIONS = {".mp4", ".mov"}


def tracked_paths() -> tuple[set[str], dict[str, str]]:
    output = subprocess.check_output(
        ["git", "ls-files", "-z"], cwd=ROOT
    ).decode("utf-8")
    paths = {path for path in output.split("\0") if path}
    normalized = {
        unicodedata.normalize("NFC", path): path for path in paths
    }
    return paths, normalized


TRACKED_PATHS, TRACKED_PATHS_BY_NFC = tracked_paths()


def excluded(path: Path) -> bool:
    return any(part in EXCLUDED_PARTS for part in path.relative_to(ROOT).parts)


def resolve_reference(html_file: Path, value: str) -> Path:
    decoded = unquote(value.split("#", 1)[0].split("?", 1)[0])
    for candidate in dict.fromkeys((
        decoded,
        unicodedata.normalize("NFD", decoded),
        unicodedata.normalize("NFC", decoded),
    )):
        resolved = (html_file.parent / candidate).resolve()
        if resolved.exists():
            return resolved
    return (html_file.parent / decoded).resolve()


def repository_path(path: Path) -> str:
    relative = path.relative_to(ROOT).as_posix()
    if relative in TRACKED_PATHS:
        return relative
    return TRACKED_PATHS_BY_NFC.get(
        unicodedata.normalize("NFC", relative),
        unicodedata.normalize("NFC", relative),
    )


def referenced_media() -> list[Path]:
    media = set()
    for html_file in ROOT.rglob("*.html"):
        if excluded(html_file):
            continue
        text = html_file.read_text(encoding="utf-8")
        for match in REFERENCE_PATTERN.finditer(text):
            value = match.group("value")
            if value.startswith(("http://", "https://", "//", "data:")):
                continue
            resolved = resolve_reference(html_file, value)
            if resolved.exists() and resolved.suffix.lower() in (
                IMAGE_EXTENSIONS | {".gif"} | VIDEO_EXTENSIONS
            ):
                media.add(resolved)
    return sorted(media, key=lambda path: repository_path(path))


def output_path(source: Path, extension: str) -> Path:
    identity = repository_path(source).encode("utf-8")
    digest = sha1(identity).hexdigest()[:16]
    return OUTPUT / f"{digest}{extension}"


def optimize_image(source: Path, destination: Path) -> None:
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        image.save(
            destination,
            "WEBP",
            quality=78,
            method=6,
        )


def optimize_gif(source: Path, destination: Path) -> None:
    with Image.open(source) as image:
        frames = []
        durations = []
        default_duration = image.info.get("duration", 100)
        loop = image.info.get("loop", 0)
        for frame in ImageSequence.Iterator(image):
            converted = frame.convert("RGBA")
            converted.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
            frames.append(converted.copy())
            durations.append(frame.info.get("duration", default_duration))
        frames[0].save(
            destination,
            "WEBP",
            save_all=True,
            append_images=frames[1:],
            duration=durations,
            loop=loop,
            quality=68,
            method=4,
            minimize_size=True,
        )


def optimize_video(source: Path, destination: Path) -> None:
    source_size = source.stat().st_size
    preset = "Preset1280x720"
    output = destination
    if source_size > 50 * 1024 * 1024:
        preset = "PresetAppleM4V480pSD"
        output = destination.with_suffix(".m4v")
    elif source_size > 20 * 1024 * 1024 or source.suffix.lower() == ".mov":
        preset = "Preset960x540"
    subprocess.run(
        [
            "avconvert",
            "--source", str(source),
            "--preset", preset,
            "--output", str(output),
            "--replace",
            "--disableMetadataFilter",
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if output != destination:
        output.replace(destination)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    referenced = referenced_media()
    for index, source in enumerate(referenced, start=1):
        suffix = source.suffix.lower()
        source_size = source.stat().st_size
        if repository_path(source).startswith("assets/homepage-media/"):
            continue

        destination = None
        if suffix in IMAGE_EXTENSIONS and source_size > 350 * 1024:
            destination = output_path(source, ".webp")
            optimize_image(source, destination)
        elif suffix == ".gif":
            destination = output_path(source, ".webp")
            optimize_gif(source, destination)
        elif suffix in VIDEO_EXTENSIONS and (
            suffix == ".mov" or source_size > 8 * 1024 * 1024
        ):
            destination = output_path(source, ".mp4")
            optimize_video(source, destination)

        if destination:
            if destination.stat().st_size >= source_size * 0.9:
                destination.unlink()
                continue
            manifest[repository_path(source)] = {
                "path": destination.relative_to(ROOT).as_posix(),
                "original_bytes": source_size,
                "optimized_bytes": destination.stat().st_size,
            }
        print(f"[{index}/{len(referenced)}] {repository_path(source)}")

    used = {entry["path"] for entry in manifest.values()}
    for old_file in OUTPUT.iterdir():
        if old_file.is_file() and old_file.relative_to(ROOT).as_posix() not in used:
            old_file.unlink()

    MANIFEST.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    original_total = sum(entry["original_bytes"] for entry in manifest.values())
    optimized_total = sum(entry["optimized_bytes"] for entry in manifest.values())
    print(
        f"Optimized {len(manifest)} files: "
        f"{original_total / 1024 / 1024:.1f} MB -> "
        f"{optimized_total / 1024 / 1024:.1f} MB"
    )


if __name__ == "__main__":
    main()
