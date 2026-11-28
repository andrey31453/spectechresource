"""Install server-only mail configuration; token arrives exclusively on stdin."""
import os
from pathlib import Path
import re
import sys
import tempfile


def configure(content, token):
    if not re.fullmatch(r"[A-Za-z0-9_-]+", token):
        raise ValueError("Invalid Rusender token format")
    values = {
        "NUXT_RUSENDER_API_TOKEN": token,
        "NUXT_RUSENDER_FROM": "info@specteh.online",
        "NUXT_RUSENDER_TO": "andrey31453@gmail.com",
        "NUXT_RUSENDER_ENABLED": "true",
    }
    lines = [line for line in content.splitlines()
             if line.split("=", 1)[0] not in values]
    return "\n".join(lines + [f"{key}={value}" for key, value in values.items()]) + "\n"


if __name__ == "__main__":
    path = Path("/opt/spectech/shared/app.env")
    result = configure(path.read_text(), sys.stdin.read().strip())
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix=".mail-env-")
    try:
        with os.fdopen(fd, "w") as output:
            output.write(result)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print("Rusender server configuration installed (secret hidden)")