#!/usr/bin/env bash
set -euo pipefail

npx ng build --output-path backend/static
npm run push-image
