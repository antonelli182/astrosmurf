#!/bin/bash
set -e

# Install dependencies using pip (ignore uv.lock)
pip install -r requirements.txt

echo "Build completed successfully"

