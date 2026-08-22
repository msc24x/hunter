#!/usr/bin/env bash
set -euo pipefail

ng build --output-path backend/static
npm run push-image
