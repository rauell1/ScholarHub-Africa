#!/bin/bash
# Install Python dependencies
python3 -m venv venv && source venv/bin/activate && pip install uv && uv pip install -r requirements.txt

# Run Vite build
npm run build

# Collect static files for Django
python3 manage.py collectstatic --noinput
