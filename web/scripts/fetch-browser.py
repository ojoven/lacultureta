"""Public-page HTTP fetch with Chrome-compatible TLS. Reads one JSON request on stdin."""
import json
import sys
from urllib.parse import urlsplit
from curl_cffi import requests

ALLOWED = {"www.donostiakultura.eus", "www.tabakalera.eus"}
try:
    request = json.load(sys.stdin)
    parsed = urlsplit(request["url"])
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED or parsed.port not in (None, 443):
        raise ValueError("URL is outside the source allowlist")
    response = requests.get(request["url"], impersonate="chrome", headers=request.get("headers", {}), timeout=40, allow_redirects=False)
    if len(response.content) > 40 * 1024 * 1024:
        raise ValueError("Source response exceeds 40 MiB")
    json.dump({"status": response.status_code, "headers": dict(response.headers), "body": response.text}, sys.stdout, ensure_ascii=False)
except Exception as error:
    json.dump({"error": str(error)}, sys.stdout)
    sys.exit(1)
