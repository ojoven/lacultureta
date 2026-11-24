#!/usr/bin/env bash
set -euo pipefail
# Run once on the target Ubuntu server. Chromium is optional; Chrome-compatible HTTP is the default alternate transport.
sudo apt-get update -qq
sudo apt-get install -y python3-venv
sudo python3 -m venv /opt/lacultureta/scraper-venv
sudo /opt/lacultureta/scraper-venv/bin/pip install -r "$(dirname "$0")/requirements-scraper.txt"
