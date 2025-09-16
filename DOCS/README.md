# 🎭 Joke Vault

A modern web application for storing and searching jokes by category. Built with vanilla JavaScript and Firebase Firestore.

## Features

- 🔍 Search jokes by content or type
- 🏷️ Filter jokes by category (Knock Knock, Dad Jokes, One-Liners, Puns)
- ➕ Add new jokes to the collection
- 🗑️ Delete jokes (with confirmation)
- 📱 Responsive design that works on all devices
- 🎨 Beautiful modern UI with smooth animations

## Demo

The app comes pre-loaded with 50 knock-knock jokes to get you started!

## Setup

### 1. Clone or Download

Clone this repository or download the files to your local machine.

### 2. Firebase Setup

Follow the instructions in `firebase-setup.md` to:
- Create a Firebase project
- Set up Firestore database
- Get your Firebase configuration
- Update the configuration in `app.js`

### 3. Serve the Files

Since this app uses ES6 modules, you need to serve it from a web server (not open the HTML file directly).

**Option 1: Python Server**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option 2: Node.js (if you have it installed)**
```bash
npx serve .
```

**Option 3: VS Code Live Server**
Install the "Live Server" extension and right-click on `index.html` → "Open with Live Server"

### 4. Open in Browser

Visit `http://localhost:8000` (or whatever port your server is using)

## GitHub Pages Deployment

### Method 1: Upload Files Directly

1. Create a new repository on GitHub
2. Upload all files (except `firebase-setup.md` if you want)
3. Go to repository Settings → Pages
4. Select "Deploy from a branch" and choose "main" branch
5. Your site will be available at `https://yourusername.github.io/repositoryname`

### Method 2: Git Commands

```bash
git init
git add .
git commit -m "Initial commit: Joke Vault website"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

Then enable GitHub Pages in your repository settings.

## File Structure

```
joke-vault/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── app.js             # JavaScript application logic
├── firebase-setup.md  # Firebase setup instructions
└── README.md          # This file
```

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Database**: Firebase Firestore
- **Hosting**: GitHub Pages (or Firebase Hosting)
- **Design**: CSS Grid, Flexbox, CSS Animations

## Browser Support

This app uses modern JavaScript features and requires a recent browser:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

## Contributing

Feel free to fork this project and submit pull requests for improvements!

## License

This project is open source and available under the MIT License.
