from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import httpx
import re

router = APIRouter()

# Headers that prevent iframe embedding — strip them from proxied responses
_BLOCK_HEADERS = {
    "x-frame-options",
    "content-security-policy",
    "content-security-policy-report-only",
}

# Headers we don't want to forward back to the browser
_DROP_RESPONSE_HEADERS = _BLOCK_HEADERS | {
    "transfer-encoding",
    "content-encoding",  # httpx decompresses; re-sending this header breaks the browser
    "content-length",    # decompressed body length differs from original
    "connection",
    "keep-alive",
}


@router.get("/api/proxy")
async def proxy(url: str):
    if not url.startswith("http"):
        raise HTTPException(400, "Invalid URL")

    try:
        async with httpx.AsyncClient(
            timeout=15,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0"},
        ) as client:
            resp = await client.get(url)
    except Exception as e:
        raise HTTPException(502, f"Fetch failed: {e}")

    content_type = resp.headers.get("content-type", "text/html")
    body = resp.content

    # For HTML responses inject a <base> tag so relative URLs resolve correctly
    if "text/html" in content_type:
        html = resp.text
        base_tag = f'<base href="{url}">'
        if re.search(r"<head[^>]*>", html, re.I):
            html = re.sub(r"(<head[^>]*>)", rf"\1{base_tag}", html, count=1, flags=re.I)
        else:
            html = base_tag + html
        body = html.encode("utf-8", errors="replace")

    # Forward safe response headers only
    headers = {
        k: v for k, v in resp.headers.items()
        if k.lower() not in _DROP_RESPONSE_HEADERS
    }

    return Response(content=body, status_code=resp.status_code,
                    headers=headers, media_type=content_type)
