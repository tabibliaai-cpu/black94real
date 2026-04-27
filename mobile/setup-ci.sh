#!/bin/bash
# ================================================================
# Black94 App — GitHub Actions Setup Script
# ================================================================
# Run this ONCE to configure GitHub Secrets for auto APK builds.
# Requirements: GitHub CLI (gh) installed and authenticated.
# ================================================================

set -e

REPO="tabibliaai-cpu/black94real"
MOBILE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "======================================================"
echo "  Black94 App — GitHub Actions Setup"
echo "  Repo: $REPO"
echo "======================================================"

# 1. Check gh CLI
if ! command -v gh &>/dev/null; then
  echo "ERROR: GitHub CLI (gh) not installed."
  echo "Install: https://cli.github.com/"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "ERROR: Not logged into GitHub CLI."
  echo "Run: gh auth login"
  exit 1
fi

# 2. Set keystore secret (base64 encoded)
echo ""
echo "[1/4] Setting RELEASE_KEYSTORE_BASE64..."
KEYSTORE_B64=$(base64 -w0 "$MOBILE_DIR/keystore/black94-release.jks")
gh secret set RELEASE_KEYSTORE_BASE64 --repo "$REPO" --body "$KEYSTORE_B64"

# 3. Set keystore passwords
echo "[2/4] Setting RELEASE_STORE_PASSWORD..."
gh secret set RELEASE_STORE_PASSWORD --repo "$REPO" --body "black94real"

echo "[3/4] Setting RELEASE_KEY_ALIAS..."
gh secret set RELEASE_KEY_ALIAS --repo "$REPO" --body "black94"

echo "[4/4] Setting RELEASE_KEY_PASSWORD..."
gh secret set RELEASE_KEY_PASSWORD --repo "$REPO" --body "black94real"

# 4. Verify
echo ""
echo "======================================================"
echo "  Secrets configured! Verifying..."
echo "======================================================"
gh secret list --repo "$REPO"

echo ""
echo "======================================================"
echo "  SETUP COMPLETE!"
echo "======================================================"
echo ""
echo "  To build & release an APK:"
echo "    1. Push code to main branch"
echo "    2. Run:  gh workflow run build-apk.yml --repo $REPO"
echo "    3. Download APK from Actions tab"
echo ""
echo "  To create a GitHub Release:"
echo "    1. Tag:  git tag v1.8.2 && git push origin v1.8.2"
echo "    2. APK auto-uploads to Releases"
echo ""
echo "  To change the keystore password later:"
echo "    gh secret set RELEASE_STORE_PASSWORD --repo $REPO"
echo "======================================================"
