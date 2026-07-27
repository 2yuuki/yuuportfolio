from pathlib import Path
from urllib.parse import quote, unquote
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
MEDIA_BASE = "https://media.githubusercontent.com/media/2yuuki/yuuportfolio/main/"
MEDIA_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".mp4", ".mov", ".pdf", ".docx"
}
EXCLUDED_PARTS = {".git", ".github", ".openai", "_site", "scripts"}
REFERENCE_PATTERN = re.compile(
    r"(?P<prefix>\b(?:src|href|poster)=[\"'])(?P<value>[^\"']+)(?P<suffix>[\"'])",
    re.IGNORECASE,
)


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

    return MEDIA_BASE + quote(relative.as_posix(), safe="/()")


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

            def replace(match: re.Match) -> str:
                value = rewrite_reference(source, match.group("value"))
                return match.group("prefix") + value + match.group("suffix")

            destination.write_text(
                REFERENCE_PATTERN.sub(replace, text),
                encoding="utf-8",
            )
        else:
            shutil.copy2(source, destination)

    (OUTPUT / ".nojekyll").touch()


if __name__ == "__main__":
    build()
