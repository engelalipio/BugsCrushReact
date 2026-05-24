#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

cp ~/Downloads/bug-blast.jsx src/App.jsx
npm run build
npx cap copy ios
