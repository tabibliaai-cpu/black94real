#!/bin/bash
set -e
echo "=== EAS Preinstall: Setting up mobile directory ==="

# EAS clones the repo to /home/expo/workingdir/build
# The .easignore prevents uploading web files, keeping the tarball small

# Copy mobile node_modules if not present
if [ ! -d "mobile/node_modules" ]; then
  echo "Installing mobile dependencies..."
  cd mobile
  npm install --legacy-peer-deps --no-audit --no-fund
  cd ..
else
  echo "mobile/node_modules already exists"
fi

# Verify android directory exists
if [ ! -d "mobile/android" ]; then
  echo "ERROR: mobile/android directory not found!"
  exit 1
fi

# Create symlink so EAS finds android/ at expected path
# EAS looks for android/ relative to app.json location
if [ ! -d "android" ]; then
  echo "Creating android symlink -> mobile/android"
  ln -s mobile/android android
fi

echo "=== Preinstall complete ==="
