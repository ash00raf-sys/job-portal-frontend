#!/usr/bin/env python3
"""Audit source-provided images used by Hugo content without modifying markdown."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import yaml
from PIL import Image


ROOT = Path(__file__).resolve().parent
CONTENT_DIR = ROOT / "content" / "english"
ASSETS_DIR = ROOT / "assets"
ALLOWED_SECTIONS = {
    "gulf-jobs",
    "kerala-jobs",
    "government-jobs",
    "private-jobs",
    "articles",
}
SKIPPED_PAGE_KEYS = {"about", "contact", "privacy-policy", "disclaimer", "search"}
ALLOW_FALLBACK = False
FALLBACK_IMAGE = "images/common/default-job.webp"
TARGET_WIDTH = 1200
TARGET_HEIGHT = 628


@dataclass
class ProcessResult:
    checked: bool
    markdown_path: Path
    reason: str
    image_path: Path | None = None
    width: int | None = None
    height: int | None = None


def find_markdown_files() -> Iterable[Path]:
    return sorted(CONTENT_DIR.rglob("*.md"))


def split_front_matter(text: str) -> tuple[str | None, str]:
    if not text.startswith("---\n"):
        return None, text
    parts = text.split("---\n", 2)
    if len(parts) < 3:
        return None, text
    return parts[1], parts[2]


def load_front_matter(front_matter: str | None) -> dict:
    if not front_matter:
        return {}
    data = yaml.safe_load(front_matter)
    return data if isinstance(data, dict) else {}


def infer_section(markdown_path: Path) -> str:
    relative = markdown_path.relative_to(CONTENT_DIR)
    if len(relative.parts) > 1:
        return relative.parts[0]
    return "common"


def should_process(markdown_path: Path) -> tuple[bool, str]:
    relative = markdown_path.relative_to(CONTENT_DIR)
    if markdown_path.name == "_index.md":
        return False, "skipped_index"

    page_key = markdown_path.stem
    if page_key in SKIPPED_PAGE_KEYS:
        return False, "skipped_static_page"

    if relative.parts and relative.parts[0] in SKIPPED_PAGE_KEYS:
        return False, "skipped_static_section"

    section = infer_section(markdown_path)
    if section not in ALLOWED_SECTIONS:
        return False, "skipped_non_post_section"

    return True, "checked"


def resolve_image_path(image_value: str) -> Path | None:
    candidate = image_value.strip()
    if not candidate:
        return None
    normalized = candidate.lstrip("/")
    for base in (ASSETS_DIR, ROOT):
        path = base / normalized
        if path.exists():
            return path
    return None


def inspect_image(image_path: Path) -> tuple[int, int]:
    with Image.open(image_path) as image:
        return image.size


def process_markdown(markdown_path: Path) -> ProcessResult:
    allowed, reason = should_process(markdown_path)
    if not allowed:
        return ProcessResult(False, markdown_path, reason)

    original_text = markdown_path.read_text(encoding="utf-8")
    front_matter, _body = split_front_matter(original_text)
    metadata = load_front_matter(front_matter)

    image_value = str(metadata.get("image") or "").strip()
    if not image_value:
        if ALLOW_FALLBACK:
            fallback_path = resolve_image_path(FALLBACK_IMAGE)
            if fallback_path is None:
                return ProcessResult(False, markdown_path, "fallback_missing")
            width, height = inspect_image(fallback_path)
            return ProcessResult(True, markdown_path, "using_fallback", fallback_path, width, height)
        return ProcessResult(False, markdown_path, "skipped_missing_image")

    image_path = resolve_image_path(image_value)
    if image_path is None:
        return ProcessResult(False, markdown_path, "missing_source_image")

    width, height = inspect_image(image_path)
    return ProcessResult(True, markdown_path, "checked", image_path, width, height)


def main() -> int:
    markdown_paths = list(find_markdown_files())
    results = [process_markdown(path) for path in markdown_paths]

    checked_count = sum(1 for result in results if result.checked)
    skipped_count = sum(1 for result in results if result.reason.startswith("skipped"))
    missing_count = sum(1 for result in results if result.reason in {"missing_source_image", "fallback_missing"})

    print("Image source audit only: yes")
    print(f"Target display ratio: {TARGET_WIDTH}:{TARGET_HEIGHT}")
    print(f"Markdown files checked: {checked_count}")
    print(f"Files skipped: {skipped_count}")
    print(f"Missing image references: {missing_count}")

    for result in results:
        relative_path = result.markdown_path.relative_to(ROOT)
        if result.reason == "checked" and result.image_path is not None:
            image_relative = result.image_path.relative_to(ROOT)
            print(f"[OK] {relative_path} -> {image_relative} ({result.width}x{result.height})")
        elif result.reason == "using_fallback" and result.image_path is not None:
            image_relative = result.image_path.relative_to(ROOT)
            print(f"[FALLBACK] {relative_path} -> {image_relative} ({result.width}x{result.height})")
        elif result.reason in {"missing_source_image", "fallback_missing"}:
            print(f"[WARN] {relative_path}: {result.reason}")

    return 0 if missing_count == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
