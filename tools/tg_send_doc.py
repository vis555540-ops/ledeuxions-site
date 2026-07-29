#!/usr/bin/env python3
"""파일을 텔레그램으로 전송. 사용: tg_send_doc.py <파일경로> [캡션] [chat_id]

봇 API 문서 전송 한도 50MB. 넘으면 알려주고 종료.
"""
import json
import mimetypes
import os
import sys
import urllib.request
import uuid

BRIDGE_DIR = os.path.expanduser("~/.claude-bridge")
with open(os.path.join(BRIDGE_DIR, "config.json")) as f:
    cfg = json.load(f)
BOT_TOKEN = cfg["bot_token"]

args = sys.argv[1:]
if not args:
    sys.exit("usage: tg_send_doc.py <file> [caption] [chat_id]")

chat_id = cfg["default_chat_id"]
if len(args) >= 2 and args[-1].lstrip("-").isdigit():
    chat_id = args[-1]
    args = args[:-1]

path = args[0]
caption = args[1] if len(args) > 1 else ""

if not os.path.isfile(path):
    sys.exit("no such file: %s" % path)
size = os.path.getsize(path)
if size > 50 * 1024 * 1024:
    sys.exit("too big for telegram bot API (%.1f MB > 50 MB)" % (size / 1048576))

boundary = uuid.uuid4().hex
name = os.path.basename(path)
ctype = mimetypes.guess_type(name)[0] or "application/octet-stream"

parts = []
def field(k, v):
    parts.append(("--%s\r\nContent-Disposition: form-data; name=\"%s\"\r\n\r\n%s\r\n"
                  % (boundary, k, v)).encode("utf-8"))

field("chat_id", str(chat_id))
if caption:
    field("caption", caption[:1024])

parts.append(("--%s\r\nContent-Disposition: form-data; name=\"document\"; filename=\"%s\"\r\n"
              "Content-Type: %s\r\n\r\n" % (boundary, name, ctype)).encode("utf-8"))
with open(path, "rb") as f:
    parts.append(f.read())
parts.append(("\r\n--%s--\r\n" % boundary).encode("utf-8"))
body = b"".join(parts)

req = urllib.request.Request(
    "https://api.telegram.org/bot%s/sendDocument" % BOT_TOKEN,
    data=body,
    headers={"Content-Type": "multipart/form-data; boundary=%s" % boundary,
             "Content-Length": str(len(body))},
)
try:
    with urllib.request.urlopen(req, timeout=300) as r:
        res = json.loads(r.read().decode("utf-8"))
    print("ok" if res.get("ok") else res)
except Exception as e:
    sys.exit("send failed: %s" % e)
