"""恢复用户旧公开仓库的相册：固定来源提交、核对 SHA256，再生成网页 JPEG。

仅首次迁移使用，已生成的照片由 Git 管理；正常 Hexo 构建不依赖 Python。
--source-dir 可指定本地旧 images 目录，省去下载。
"""
import argparse
import hashlib
import io
import json
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "https://raw.githubusercontent.com/sklxaioliu/sklxaioliu.github.io/0005e7a32eaf2dc1580f0731c8f9ca58e06279db/images/"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path)
    args = parser.parse_args()
    galleries = json.loads((ROOT / "source/_data/work-galleries.json").read_text(encoding="utf-8"))
    photos = [photo for gallery in galleries for photo in gallery["photos"] if not photo["missing"]]

    def restore(photo):
        if args.source_dir:
            raw = (args.source_dir / photo["file"]).read_bytes()
        else:
            for attempt in range(3):
                try:
                    request = Request(SOURCE + quote(photo["file"]), headers={"User-Agent": "Rambler-Blog-Photo-Migration"})
                    with urlopen(request, timeout=60) as response:
                        raw = response.read()
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    time.sleep(attempt + 1)
        if hashlib.sha256(raw).hexdigest() != photo["sourceSha256"]:
            raise ValueError("原始照片校验不符: " + photo["file"])
        destination = (ROOT / "source" / photo["src"].lstrip("/")).resolve()
        if not destination.is_relative_to(ROOT / "source/img/work/gallery"):
            raise ValueError("图片输出目录异常")
        destination.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(io.BytesIO(raw)) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            image = image.resize((photo["width"], photo["height"]), Image.Resampling.LANCZOS)
            image.save(destination, "JPEG", quality=82, optimize=True)
        return destination.stat().st_size

    with ThreadPoolExecutor(max_workers=4) as pool:
        sizes = list(pool.map(restore, photos))
    print(f"已恢复 {len(sizes)} 张照片，网页文件合计 {sum(sizes)} 字节；所有原文件 SHA256 一致。")


if __name__ == "__main__":
    main()
