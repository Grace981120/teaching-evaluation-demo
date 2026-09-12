"""Build the public static files; keep server code and secrets outside dist."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent.parent
output = root / "dist"
output.mkdir(exist_ok=True)
for entry in output.iterdir():
    if entry.is_dir():
        shutil.rmtree(entry)
    else:
        entry.unlink()
for pattern in ("*.html", "*.css", "*.js"):
    for source in root.glob(pattern):
        shutil.copy2(source, output / source.name)
shutil.copytree(root / "assets", output / "assets", ignore=shutil.ignore_patterns("recording-video-web", "recording-video-web-final", "recording-video-published"))
shutil.copytree(root / "agent-assets", output / "agent-assets")
for manifest in (output / "assets" / "figma").glob("*manifest.json"):
    manifest.unlink()
print(f"Built {sum(p.is_file() for p in output.rglob('*'))} static files")
