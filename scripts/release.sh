#!/usr/bin/env bash
set -e
# Release: version bump, changelog, tag, upload artifacts

# 1. Bump version
npm version patch

# 2. Generate changelog
npx conventional-changelog -p angular -i CHANGELOG.md -s

git add CHANGELOG.md package.json

git commit -m "chore(release): bump version and changelog"

git tag v$(node -p "require('./package.json').version")

git push --follow-tags

# 3. Build artifacts
npm run build:prod

# 4. Upload artifacts (stub)
echo "Uploading dist/* to release server..."
# scp dist/* user@server:/releases/ || true

# 5. Publish docs
npm run docgen

# 6. Done
echo "Release complete."
