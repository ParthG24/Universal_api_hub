"""
Universal AI API Hub - Application Entrypoint Failsafe
This module allows Render deployments running the default 'gunicorn your_application.wsgi'
to seamlessly boot the FastAPI ASGI application on Uvicorn without error.
"""
import os
import sys

port = os.environ.get("PORT", "10000")
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

# Hand over process execution directly to Uvicorn
os.execv(
    sys.executable,
    [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        str(port),
        "--app-dir",
        backend_dir,
    ],
)
