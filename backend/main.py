import os
import base64
import re
import io
import json
import httpx
from PIL import Image
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")

# 兜底中转配置（gpt-image-1 不可用时降级）
FALLBACK_API_KEY = os.environ.get("FALLBACK_API_KEY", "sk-TD5mko9EUjlhT293pGfzrw7pcVKb4yq9BnKvQTP3IKiAXR6q")
FALLBACK_BASE_URL = "https://yungpt.com/v1"

# 当前 API provider: "openai" 或 "grok"
_current_provider = "openai"


class ProviderRequest(BaseModel):
    provider: str  # "openai" 或 "grok"


@app.post("/api/set-provider")
async def set_provider(req: ProviderRequest):
    global _current_provider
    if req.provider not in ("openai", "grok"):
        raise HTTPException(status_code=400, detail="provider 必须是 openai 或 grok")
    _current_provider = req.provider
    return {"provider": _current_provider}


@app.get("/api/provider")
async def get_provider():
    return {"provider": _current_provider}


@app.post("/api/cyber-nails")
async def cyber_nails(
    hand: UploadFile = File(...),
    nail: UploadFile = File(None),
    nail_url: str = Form(None),
):
    hand_data = await hand.read()

    if nail and nail.filename:
        nail_data = await nail.read()
    elif nail_url:
        if nail_url.startswith("/"):
            # 本地路径，从 Vite public 目录读取
            import pathlib
            local_path = pathlib.Path("/Users/zhuzijie1/change-your-life/public") / nail_url.lstrip("/")
            if local_path.exists():
                nail_data = local_path.read_bytes()
            else:
                raise HTTPException(status_code=400, detail=f"本地文件不存在: {nail_url}")
        else:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as dl:
                r = await dl.get(nail_url, headers={"Referer": "https://www.xiaohongshu.com/"})
            nail_data = r.content
    else:
        raise HTTPException(status_code=400, detail="需要提供美甲图")

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

    # 读取当前 provider 选择
    provider = _current_provider

    if provider == "openai":
        try:
            return await _call_openai_responses(hand_data, nail_data, prompt)
        except Exception as e:
            print(f"[OpenAI API failed, falling back]: {e}")
            return await _call_grok_fallback(hand_data, nail_data, prompt)
    else:
        return await _call_grok_fallback(hand_data, nail_data, prompt)


async def _call_openai_responses(hand_data: bytes, nail_data: bytes, prompt: str):
    # gpt-image-1 用 /images/edits 端点，multipart form 上传多图
    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(
            f"{OPENAI_BASE_URL}/images/edits",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            data={
                "model": "gpt-image-1",
                "prompt": prompt,
                "n": "1",
                "size": "1024x1024",
            },
            files=[
                ("image[]", ("hand.jpg", hand_data, "image/jpeg")),
                ("image[]", ("nail.jpg", nail_data, "image/jpeg")),
            ],
        )

    if resp.status_code != 200:
        raise Exception(f"OpenAI API error {resp.status_code}: {resp.text[:500]}")

    data = resp.json()
    if "data" in data and data["data"]:
        img_b64 = data["data"][0].get("b64_json")
        if img_b64:
            return JSONResponse({"image": f"data:image/png;base64,{img_b64}"})

    raise Exception(f"No image in OpenAI response: {json.dumps(data)[:500]}")


async def _call_grok_fallback(hand_data: bytes, nail_data: bytes, prompt: str):
    hand_b64 = base64.b64encode(hand_data).decode()
    nail_b64 = base64.b64encode(nail_data).decode()
    payload = {
        "model": "grok-3-image",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{hand_b64}"}},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{nail_b64}"}},
                {"type": "text", "text": prompt},
            ]
        }]
    }

    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(
            f"{FALLBACK_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {FALLBACK_API_KEY}", "Content-Type": "application/json"},
            json=payload,
        )
    data = resp.json()
    if "error" in data or "choices" not in data:
        raise HTTPException(status_code=500, detail=str(data))
    content = data["choices"][0]["message"]["content"]

    urls = re.findall(r'!\[.*?\]\((.*?)\)', content)
    if not urls:
        raise ValueError("No image in grok response")

    img_url = urls[0]
    if img_url.startswith("data:"):
        return JSONResponse({"image": img_url})

    async with httpx.AsyncClient(timeout=60) as img_client:
        img_resp = await img_client.get(img_url)
    img_b64 = base64.b64encode(img_resp.content).decode()
    return JSONResponse({"image": f"data:image/png;base64,{img_b64}"})


class ParseUrlRequest(BaseModel):
    url: str


@app.post("/api/parse-nail-url")
async def parse_nail_url(req: ParseUrlRequest):
    import json as json_mod
    url = req.url.strip()

    # 提取第一个 http 链接（兼容小红书分享文案）
    url_match = re.search(r'https?://\S+', url)
    if url_match:
        url = url_match.group(0)

    # 短链展开
    if "xhslink.com" in url or len(url) < 60:
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                r = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
                url = str(r.url)
        except Exception:
            pass

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
                "Referer": "https://www.xiaohongshu.com/",
            })
        html = resp.text

        # 解析 __INITIAL_STATE__
        m = re.search(r'window\.__INITIAL_STATE__\s*=\s*(\{.*?\});?\s*</script>', html, re.DOTALL)
        if m:
            raw = re.sub(r'\bundefined\b', 'null', m.group(1))
            try:
                data = json_mod.loads(raw)

                # 优先从 normalNotePreloadData.imagesList 提取无水印大图
                images = []
                try:
                    preload = data.get("noteData", {}).get("normalNotePreloadData", {})
                    img_list = preload.get("imagesList", [])
                    for item in img_list:
                        large_url = item.get("urlSizeLarge", "")
                        if large_url:
                            # 把 webp 改 jpg，确保 origin=0
                            img_url = large_url.replace("/format/webp", "/format/jpg")
                            if "origin=0" not in img_url:
                                img_url += "&origin=0" if "?" in img_url else "?origin=0"
                            images.append(img_url)
                except Exception:
                    pass

                # 如果上面没拿到，降级到 imageList 的 infoList
                if not images:
                    try:
                        note = data.get("noteData", {}).get("data", {}).get("noteData", {})
                        for item in note.get("imageList", []):
                            img_url = item.get("url", "")
                            if img_url and ("xhscdn" in img_url or "sns-img" in img_url):
                                # 去掉 !h5_1080jpg 等水印后缀，换用无水印域名
                                base = img_url.split("!")[0]
                                # 替换为无水印域名
                                no_wm = re.sub(r'https?://sns-webpic-qc\.xhscdn\.com/\d+/[a-f0-9]+/', 'http://sns-na-i6.xhscdn.com/', base)
                                if no_wm != base:
                                    no_wm += "?imageView2/2/w/1080/format/jpg&origin=0"
                                else:
                                    no_wm += "?imageView2/2/w/1080/format/jpg"
                                images.append(no_wm)
                    except Exception:
                        pass

                # 最后兜底：递归搜索带水印的图
                if not images:
                    def find_images(obj, results=None):
                        if results is None:
                            results = []
                        if isinstance(obj, dict):
                            for k, v in obj.items():
                                if k in ('url', 'urlDefault', 'originUrl') and isinstance(v, str) \
                                        and ('xhscdn' in v or 'sns-img' in v) and '!h5_1080jpg' in v:
                                    if v not in results:
                                        results.append(v)
                                else:
                                    find_images(v, results)
                        elif isinstance(obj, list):
                            for i in obj:
                                find_images(i, results)
                        return results
                    images = find_images(data)

                # 去重
                seen, unique = set(), []
                for img in images:
                    base = re.sub(r'[?!].*$', '', img)
                    if base not in seen:
                        seen.add(base)
                        unique.append(img)

                if unique:
                    return {"images": unique[:9]}
            except Exception:
                pass

        raise HTTPException(status_code=422, detail="未找到图片，请手动上传")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
