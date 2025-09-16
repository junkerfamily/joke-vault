#!/bin/bash

echo "🚀 Setting up Git repository for Joke Vault..."

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Joke Vault - A modern joke storage and search web app

Features:
- Search and filter jokes by category
- Add new jokes to the collection
- Delete jokes with confirmation
- Responsive modern UI
- Pre-loaded with 50 knock-knock jokes
- Firebase Firestore backend
- GitHub Pages deployment ready"

# Set main branch
git branch -M main

echo "✅ Git repository initialized!"
echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Run: git remote add origin https://github.com/yourusername/your-repo-name.git"
echo "3. Run: git push -u origin main"
echo "4. Enable GitHub Pages in repository settings"
echo ""
echo "Don't forget to:"
echo "- Update Firebase configuration in app.js"
echo "- Follow instructions in firebase-setup.md"
