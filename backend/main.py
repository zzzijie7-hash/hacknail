import os
import base64
import re
import io
import httpx
from PIL import Image
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.environ.get("OPENAI_API_KEY", "sk-TD5mko9EUjlhT293pGfzrw7pcVKb4yq9BnKvQTP3IKiAXR6q")
BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://yungpt.com/v1")


@app.post("/api/cyber-nails")
async def cyber_nails(
    hand: UploadFile = File(...),
    nail: UploadFile = File(None),
    nail_url: str = Form(None),
):
    hand_data = await hand.read()

    # nail 可以是上传文件或远程 URL
    if nail and nail.filename:
        nail_data = await nail.read()
    elif nail_url:
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
    hand_b64 = base64.b64encode(hand_data).decode()
    nail_b64 = base64.b64encode(nail_data).decode()
    hand_mime = "image/jpeg"
    nail_mime = "image/jpeg"

    payload = {
        "model": "grok-3-image",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:{hand_mime};base64,{hand_b64}"}},
                {"type": "image_url", "image_url": {"url": f"data:{nail_mime};base64,{nail_b64}"}},
                {"type": "text", "text": (
                    "请将第一张图中手部的指甲替换为第二张图的美甲款式。"
                    "要求：完整复现第二张图每根手指不同的指甲设计，"
                    "手部皮肤、背景、光线完全不变，只替换指甲部分。"
                    "请直接输出编辑后的图片。"
                )}
            ]
        }]
    }

    try:
        async with httpx.AsyncClient(timeout=300) as api_client:
            resp = await api_client.post(
                f"{BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
                json=payload,
            )
        data = resp.json()
        if "error" in data or "choices" not in data:
            raise HTTPException(status_code=500, detail=str(data))
        content = data["choices"][0]["message"]["content"]

        # 提取图片 URL
        urls = re.findall(r'!\[.*?\]\((.*?)\)', content)
        if not urls:
            raise ValueError("No image in response")

        img_url = urls[0]

        # 如果是 data URL 直接返回，否则下载
        if img_url.startswith("data:"):
            return JSONResponse({"image": img_url})

        async with httpx.AsyncClient(timeout=60) as img_client:
            img_resp = await img_client.get(img_url)
        img_b64 = base64.b64encode(img_resp.content).decode()
        return JSONResponse({"image": f"data:image/png;base64,{img_b64}"})

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())


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
                    base = img.split('!')[0]
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
