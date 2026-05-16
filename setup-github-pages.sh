#!/bin/bash
# Quick setup script for GitHub Pages deployment

echo "🚌 Cherkasy Departures System - GitHub Pages Setup"
echo "=================================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git not initialized. Run this first:"
    echo "   git init"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/GTFS-DEPARTES.git"
    exit 1
fi

# Check if index.html exists
if [ ! -f index.html ]; then
    echo "❌ index.html not found in current directory"
    exit 1
fi

# Check if .github/workflows/pages.yml exists
if [ ! -f .github/workflows/pages.yml ]; then
    echo "❌ GitHub workflow not found. Creating..."
    mkdir -p .github/workflows
    echo "⚠️  Please manually create .github/workflows/pages.yml - see DEPLOYMENT_GUIDE.md"
    exit 1
fi

echo "✅ Project structure verified:"
echo "   ✓ Git repository initialized"
echo "   ✓ index.html present"
echo "   ✓ GitHub Pages workflow present"
echo ""

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

echo "📝 Next steps:"
echo "1. Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Initial commit: Cherkasy departures system'"
echo "   git push -u origin $BRANCH"
echo ""
echo "2. Enable GitHub Pages:"
echo "   - Go to: https://github.com/YOUR_USERNAME/GTFS-DEPARTES/settings/pages"
echo "   - Source: Select 'GitHub Actions'"
echo "   - Save"
echo ""
echo "3. Check deployment:"
echo "   - Go to: https://github.com/YOUR_USERNAME/GTFS-DEPARTES/actions"
echo "   - Wait for workflow to complete (✅ green checkmark)"
echo ""
echo "4. Access your site:"
echo "   - https://YOUR_USERNAME.github.io/GTFS-DEPARTES/"
echo ""
echo "🚀 Setup complete! Follow the steps above to deploy."
