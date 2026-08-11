#!/bin/bash
# Install Python dependencies
pip3 install uv && uv pip install --system -r requirements.txt

# Run Vite build
npm run build

# Collect static files for Django
python3 manage.py collectstatic --noinput
