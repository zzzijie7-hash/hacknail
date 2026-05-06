import os, re, io, json, base64, pathlib, shutil
import httpx
from PIL import Image
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── 图片存储配置 ──────────────────────────────────────
PUBLIC = pathlib.Path(__file__).resolve().parent.parent / "public" / "posts"
CAT_MAP = {"nail": "nail", "pet": "pet", "rental": "rental", "portrait": "portrait"}
CAT_LABEL = {"nail": "美甲", "pet": "宠物穿搭", "rental": "租房户型", "portrait": "写真摄影"}
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
FALLBACK_API_KEY = os.environ.get("FALLBACK_API_KEY", "sk-TD5mko9EUjlhT293pGfzrw7pcVKb4yq9BnKvQTP3IKiAXR6q")
FALLBACK_BASE_URL = "https://yungpt.com/v1"
_current_provider = "openai"

# ── manifest.json 读写 ──────────────────────────────────
def _load_manifest():
    p = PUBLIC / "manifest.json"
    if p.exists():
        return json.loads(p.read_text())
    return {}

def _save_manifest(m):
    (PUBLIC / "manifest.json").write_text(json.dumps(m, ensure_ascii=False, indent=2))

# ── API ────────────────────────────────────────────────

@app.get("/api/manifest")
async def get_manifest():
    return _load_manifest()

class UploadMeta(BaseModel):
    category: str  # nail / pet / rental / portrait

@app.post("/api/upload")
async def upload_images(category: str = Form(...), files: list[UploadFile] = File(...)):
    if category not in CAT_MAP:
        raise HTTPException(400, f"类别错误: {category}")
    cat_dir = PUBLIC / CAT_MAP[category]
    cat_dir.mkdir(parents=True, exist_ok=True)

    # 算最高序号
    existing = [f.name for f in cat_dir.iterdir() if f.suffix.lower() in ALLOWED_EXT]
    max_id = -1
    prev = CAT_MAP[category]
    for fn in existing:
        m = re.match(rf'{prev}(\d+)_\d+', fn)
        if m:
            max_id = max(max_id, int(m.group(1)))

    saved = 0
    for f in files:
        if not f.filename:
            continue
        ext = pathlib.Path(f.filename).suffix.lower()
        if ext not in ALLOWED_EXT:
            continue

        # 本次上传的组: max_id+1, 组内递增
        group_id = max_id + 1
        # 找现有组内最大后缀
        group_idx = 0
        for fn in existing:
            m2 = re.match(rf'{prev}{group_id}_(\d+)', fn)
            if m2:
                group_idx = max(group_idx, int(m2.group(1)) + 1)
        # 本次 batch 内部的计数
        new_name = f"{prev}{group_id}_{group_idx + saved}.jpg"

        data = await f.read()
        # compress large images
        img = Image.open(io.BytesIO(data)).convert("RGB")
        if max(img.size) > 1200:
            img.thumbnail((1200, 1200), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=88)
        (cat_dir / new_name).write_bytes(buf.getvalue())
        existing.append(new_name)
        saved += 1
        print(f"[upload] {category} -> {new_name}")

    if saved:
        _rebuild_manifest()
    return {"ok": True, "category": category, "saved": saved, "group_id": max_id + 1}

def _rebuild_manifest():
    m = {}
    for cat_key, dir_name in CAT_MAP.items():
        d = PUBLIC / dir_name
        if not d.exists():
            continue
        groups = {}
        for f in sorted(d.iterdir()):
            if f.suffix.lower() not in ALLOWED_EXT:
                continue
            fn = f.name.rsplit('.', 1)[0]
            parts = fn.rsplit('_', 1)
            if len(parts) == 2:
                gid, _ = parts
            else:
                gid = fn
            groups.setdefault(gid, []).append(f"/posts/{dir_name}/{f.name}")
        items = []
        for gid in sorted(groups.keys()):
            imgs = sorted(groups[gid])
            items.append({
                "title": f"{CAT_LABEL.get(cat_key, cat_key)} #{gid}（{len(imgs)}张）",
                "author": "素材库",
                "likes": 100 + len(imgs) * 30,
                "images": imgs,
            })
        m[cat_key] = items
    _save_manifest(m)

# ── Provider ───────────────────────────────────────────
class ProviderRequest(BaseModel):
    provider: str

@app.post("/api/set-provider")
async def set_provider(req: ProviderRequest):
    global _current_provider
    if req.provider not in ("openai", "grok"):
        raise HTTPException(400, "provider 必须是 openai 或 grok")
    _current_provider = req.provider
    return {"provider": _current_provider}

@app.get("/api/provider")
async def get_provider():
    return {"provider": _current_provider}

# ── Cyber Nails ────────────────────────────────────────
@app.post("/api/cyber-nails")
async def cyber_nails(hand: UploadFile = File(...), nail: UploadFile = File(None),
                      nail_url: str = Form(None)):
    hand_data = await hand.read()
    if nail and nail.filename:
        nail_data = await nail.read()
    elif nail_url:
        if nail_url.startswith("/"):
            lp = PUBLIC.parent / nail_url.lstrip("/")
            if lp.exists():
                nail_data = lp.read_bytes()
            else:
                raise HTTPException(400, f"本地文件不存在: {nail_url}")
        else:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as dl:
                r = await dl.get(nail_url, headers={"Referer": "https://www.xiaohongshu.com/"})
            nail_data = r.content
    else:
        raise HTTPException(400, "需要提供美甲图")

    def compress(data, max_size=1024):
        img = Image.open(io.BytesIO(data)).convert("RGB")
        if max(img.size) > max_size:
            img.thumbnail((max_size, max_size), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return buf.getvalue()

    hand_data = compress(hand_data)
    nail_data = compress(nail_data)
    prompt = (
        "Edit the first image (hand photo): replace the nails on this hand with the nail art design shown in the second image. "
        "Requirements: precisely replicate each nail's design from the second image onto the corresponding nail of the first image. "
        "Keep the hand skin, background, and lighting completely unchanged. Only modify the nail area. "
        "Output the edited image directly."
    )

    if _current_provider == "openai":
        try:
            return await _openai_edits(hand_data, nail_data, prompt)
        except Exception as e:
            print(f"[OpenAI failed, fallback]: {e}")
            return await _grok_gen(hand_data, nail_data, prompt)
    else:
        return await _grok_gen(hand_data, nail_data, prompt)

async def _openai_edits(hd, nd, prompt):
    async with httpx.AsyncClient(timeout=300) as c:
        resp = await c.post(f"{OPENAI_BASE_URL}/images/edits",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            data={"model": "gpt-image-1", "prompt": prompt, "n": "1", "size": "1024x1024"},
            files=[("image[]", ("hand.jpg", hd, "image/jpeg")),
                   ("image[]", ("nail.jpg", nd, "image/jpeg"))])
    if resp.status_code != 200:
        raise Exception(f"OpenAI error {resp.status_code}: {resp.text[:500]}")
    data = resp.json()
    if "data" in data and data["data"]:
        b64 = data["data"][0].get("b64_json")
        if b64:
            return JSONResponse({"image": f"data:image/png;base64,{b64}"})
    raise Exception(f"No image: {json.dumps(data)[:500]}")

async def _grok_gen(hd, nd, prompt):
    hb64 = base64.b64encode(hd).decode()
    nb64 = base64.b64encode(nd).decode()
    async with httpx.AsyncClient(timeout=300) as c:
        resp = await c.post(f"{FALLBACK_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {FALLBACK_API_KEY}", "Content-Type": "application/json"},
            json={"model": "grok-3-image", "messages": [{"role": "user", "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{hb64}"}},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{nb64}"}},
                {"type": "text", "text": prompt}]}]})
    data = resp.json()
    if "error" in data or "choices" not in data:
        raise HTTPException(500, str(data))
    urls = re.findall(r'!\[.*?\]\((.*?)\)', data["choices"][0]["message"]["content"])
    if not urls:
        raise ValueError("No image in grok response")
    img_url = urls[0]
    if img_url.startswith("data:"):
        return JSONResponse({"image": img_url})
    async with httpx.AsyncClient(timeout=60) as ic:
        ir = await ic.get(img_url)
    return JSONResponse({"image": f"data:image/png;base64,{base64.b64encode(ir.content).decode()}"})

# ── Parse URL ──────────────────────────────────────────
class ParseUrlRequest(BaseModel):
    url: str

@app.post("/api/parse-nail-url")
async def parse_nail_url(req: ParseUrlRequest):
    url = req.url.strip()
    url_match = re.search(r'https?://\S+', url)
    if url_match:
        url = url_match.group(0)
    if "xhslink.com" in url or len(url) < 60:
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as c:
                r = await c.get(url, headers={"User-Agent": "Mozilla/5.0"})
                url = str(r.url)
        except Exception:
            pass
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as c:
            resp = await c.get(url, headers={
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
                "Referer": "https://www.xiaohongshu.com/"})
        html = resp.text
        m = re.search(r'window\.__INITIAL_STATE__\s*=\s*(\{.*?\});?\s*</script>', html, re.DOTALL)
        if m:
            raw = re.sub(r'\bundefined\b', 'null', m.group(1))
            try:
                data = json.loads(raw)
            except Exception:
                raise HTTPException(422, "解析JSON失败")
            images = []
            try:
                preload = data.get("noteData", {}).get("normalNotePreloadData", {})
                for item in preload.get("imagesList", []):
                    large_url = item.get("urlSizeLarge", "")
                    if large_url:
                        img_url = large_url.replace("/format/webp", "/format/jpg")
                        if "origin=0" not in img_url:
                            img_url += "&origin=0" if "?" in img_url else "?origin=0"
                        images.append(img_url)
            except Exception:
                pass
            if not images:
                try:
                    note = data.get("noteData", {}).get("data", {}).get("noteData", {})
                    for item in note.get("imageList", []):
                        img_url = item.get("url", "")
                        if img_url and ("xhscdn" in img_url or "sns-img" in img_url):
                            base = img_url.split("!")[0]
                            no_wm = re.sub(r'https?://sns-webpic-qc\.xhscdn\.com/\d+/[a-f0-9]+/',
                                           'http://sns-na-i6.xhscdn.com/', base)
                            no_wm += "?imageView2/2/w/1080/format/jpg&origin=0"
                            images.append(no_wm)
                except Exception:
                    pass
            if not images:
                def find_images(obj, results=None):
                    if results is None: results = []
                    if isinstance(obj, dict):
                        for k, v in obj.items():
                            if k in ('url', 'urlDefault', 'originUrl') and isinstance(v, str) \
                                    and ('xhscdn' in v or 'sns-img' in v) and '!h5_1080jpg' in v:
                                if v not in results: results.append(v)
                            else:
                                find_images(v, results)
                    elif isinstance(obj, list):
                        for i in obj: find_images(i, results)
                    return results
                images = find_images(data)
            seen, unique = set(), []
            for img in images:
                base = re.sub(r'[?!].*$', '', img)
                if base not in seen:
                    seen.add(base); unique.append(img)
            if unique:
                return {"images": unique[:9]}
        raise HTTPException(422, "未找到图片，请手动上传")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
