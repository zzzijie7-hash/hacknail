"""
指甲区域检测 + mask 生成
用 mediapipe HandLandmarker 识别手指关键点，推断指甲位置，生成透明遮罩
"""

import io
import math
import pathlib
import numpy as np
from PIL import Image, ImageDraw

_MODEL_PATH = pathlib.Path(__file__).resolve().parent / "hand_landmarker.task"

# 手指关键点索引 (mediapipe hand landmarks)
FINGERS = {
    "thumb":  (1, 2, 3, 4),
    "index":  (5, 6, 7, 8),
    "middle": (9, 10, 11, 12),
    "ring":   (13, 14, 15, 16),
    "pinky":  (17, 18, 19, 20),
}

NAIL_WIDTH_FACTOR = 0.40
NAIL_TIP_EXTEND = 0.25
NAIL_START_SHIFT = 0.05


def detect_nail_masks(image_bytes):
    """
    Returns (PIL.Image RGBA mask, list of nail info dicts)
    Mask: nail areas are transparent (0,0,0,0), rest is black semi-opaque
    """
    with Image.open(io.BytesIO(image_bytes)) as pil_img:
        w, h = pil_img.size
        rgb_arr = np.array(pil_img.convert("RGB"))

    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision
    from mediapipe import Image as mp_Image
    from mediapipe import ImageFormat

    if not _MODEL_PATH.exists():
        print("[nail_mask] model not found, using fallback")
        return _fallback_mask(w, h)

    try:
        options = vision.HandLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=str(_MODEL_PATH)),
            num_hands=2,
            min_hand_detection_confidence=0.5,
        )
        landmarker = vision.HandLandmarker.create_from_options(options)
    except Exception as e:
        print(f"[nail_mask] landmarker create failed: {e}")
        return _fallback_mask(w, h)

    mp_image = mp_Image(image_format=ImageFormat.SRGB, data=rgb_arr)
    result = landmarker.detect(mp_image)
    landmarker.close()

    if not result.hand_landmarks:
        print("[nail_mask] no hand detected")
        return _fallback_mask(w, h)

    lm_list = result.hand_landmarks[0]
    mask = Image.new("RGBA", (w, h), (0, 0, 0, 200))
    draw = ImageDraw.Draw(mask)
    nail_info = []

    for finger_name, (_, mcp_idx, dip_idx, tip_idx) in FINGERS.items():
        mcp = _pt(lm_list[mcp_idx], w, h)
        dip = _pt(lm_list[dip_idx], w, h)
        tip = _pt(lm_list[tip_idx], w, h)

        nail_start = _lerp(dip, tip, NAIL_START_SHIFT)
        nail_end = _lerp(dip, tip, 1.0 + NAIL_TIP_EXTEND)
        nail_center = _lerp(nail_start, nail_end, 0.5)
        nail_len = _dist(nail_start, nail_end)

        pip = _pt(lm_list[mcp_idx + 1], w, h)
        finger_len = _dist(pip, tip)
        nail_width = finger_len * NAIL_WIDTH_FACTOR

        dx, dy = tip[0] - dip[0], tip[1] - dip[1]
        mag = math.sqrt(dx * dx + dy * dy) or 1
        dx, dy = dx / mag, dy / mag
        px, py = -dy, dx
        half_w, half_l = nail_width / 2, nail_len / 2

        bbox = [
            nail_center[0] - half_w, nail_center[1] - half_l,
            nail_center[0] + half_w, nail_center[1] + half_l,
        ]
        draw.ellipse(bbox, fill=(0, 0, 0, 0))

        corners = [
            (nail_center[0] + px * half_w + dx * half_l, nail_center[1] + py * half_w + dy * half_l),
            (nail_center[0] - px * half_w + dx * half_l, nail_center[1] - py * half_w + dy * half_l),
            (nail_center[0] - px * half_w - dx * half_l, nail_center[1] - py * half_w - dy * half_l),
            (nail_center[0] + px * half_w - dx * half_l, nail_center[1] + py * half_w - dy * half_l),
        ]
        nail_info.append({"finger": finger_name, "center": nail_center, "corners": corners})

    print(f"[nail_mask] detected {len(nail_info)} nails")
    return mask, nail_info


def _pt(landmark, w, h):
    return (landmark.x * w, landmark.y * h)


def _dist(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def _lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def _fallback_mask(w, h):
    mask = Image.new("RGBA", (w, h), (0, 0, 0, 200))
    draw = ImageDraw.Draw(mask)
    tip_y = h * 0.28
    nw, nh = w * 0.06, h * 0.06
    for cx in [w * 0.60, w * 0.48, w * 0.36, w * 0.24, w * 0.14]:
        draw.ellipse([cx - nw, tip_y - nh, cx + nw, tip_y + nh], fill=(0, 0, 0, 0))
    return mask, []
