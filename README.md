# Personal Portfolio Website

A modern, responsive personal portfolio website built with HTML, CSS, and JavaScript featuring Material Design 3 components. Showcases projects, publications, and professional information.

## Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Material Design 3**: Modern UI components following Material Design principles
- **Interactive Animations**: Smooth transitions and animated space background
- **Project Portfolio**: Featured projects with filtering and detailed project pages
- **Publications Page**: Dynamic loading of academic publications and research papers
- **Strava Integration**: Running activities dashboard with performance metrics
- **Resume Viewer**: Integrated PDF resume viewer with automatic updates
- **SEO Optimized**: Comprehensive meta tags, Open Graph, and structured data
- **Performance Optimized**: Lazy loading, image optimization, and efficient asset management
- **404 Page**: Custom error page with navigation options

## Technologies

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Design**: Material Design 3, Material Symbols
- **Fonts**: Inter (Google Fonts)
- **Build Tools**: Node.js, npm
- **Deployment**: GitHub Pages (with custom domain support)
- **Analytics**: Google Analytics

## Project Structure

```
cabhinav/
├── assets/
│   ├── css/              # Stylesheets
│   │   ├── grok-style.css
│   │   ├── space-background.css
│   │   └── ...
│   ├── js/               # JavaScript modules
│   │   ├── grok-script.js
│   │   ├── homepage-space-background.js
│   │   └── ...
│   ├── images/           # Images and assets
│   └── documents/        # Resume PDF
├── projects/             # Project showcase pages
├── publications/         # Academic publications
├── strava/              # Strava activities dashboard
├── chat/                # Interactive chat interface
├── space/               # Space-themed page
├── cli/                 # CLI documentation
├── scripts/             # Utility scripts
│   ├── update-resume.js
│   ├── update-resume.sh
│   └── sitemap-generator.js
├── config/              # Configuration files
│   └── robots.txt
├── index.html           # Homepage
├── 404.html             # Custom 404 page
├── sitemap.xml          # SEO sitemap
└── package.json         # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/abhinav937/cabhinav.git
cd cabhinav
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
# or
npm start
```

4. Open your browser to the URL shown (typically **http://localhost:5173**)

The dev server will automatically reload when you make changes to your code.

## Available Pages

- **Homepage** (`/`): Hero section with introduction and quick links
- **Projects** (`/projects/`): Featured projects showcase
- **Publications** (`/publications/`): Academic publications and research papers
- **Strava** (`/strava/`): Running activities and performance metrics
- **Chat** (`/chat/`): Interactive chat interface
- **Space** (`/space/`): Space-themed interactive page
- **CLI Docs** (`/cli/`): Command-line interface documentation

## Updating Resume

The resume PDF is automatically pulled from the GitHub resume repository ([abhinav937/resume](https://github.com/abhinav937/resume)).

### Manual Update

To manually update your resume PDF:

```bash
# Using npm script
npm run update-resume

# Or directly run the Node.js script
node scripts/update-resume.js

# Or use the shell script (Unix/Linux/Mac)
./scripts/update-resume.sh
```

### Resume Source

The resume PDF is automatically downloaded from:
```
https://raw.githubusercontent.com/abhinav937/resume/main/main.pdf
```

### Update Process

1. Update the PDF (`main.pdf`) in your resume repository
2. Run the update script on your website repository:
   ```bash
   npm run update-resume
   ```
3. Commit and push the changes:
   ```bash
   git add assets/documents/abhinav-chinnusamy-resume.pdf
   git commit -m "Update resume"
   git push
   ```

### Script Options

The `update-resume.js` script supports various options:

```bash
# Download from releases
node scripts/update-resume.js --from-releases

# Custom repository
node scripts/update-resume.js --repo owner/repo-name

# Custom branch
node scripts/update-resume.js --branch develop

# Custom file path
node scripts/update-resume.js --path resume.pdf

# Custom output path
node scripts/update-resume.js --output path/to/resume.pdf

# Show help
node scripts/update-resume.js --help
```

## Deployment

The website is automatically deployed to GitHub Pages using GitHub Actions.

### Automatic Deployment

When you push to the `main` branch, GitHub Actions will:
1. Build the React app using Vite
2. Deploy to GitHub Pages automatically

### GitHub Pages Configuration

1. Go to your repository **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow will automatically deploy from the `dist/` folder

### Custom Domain

The website supports custom domain (`cabhinav.com`) via the `CNAME` file.

### Manual Deployment (if needed)

If you need to deploy manually:

```bash
npm run build:gh-pages
git add .
git commit -m "Deploy React app"
git push
```

## SEO Features

- Comprehensive meta tags (description, keywords, author)
- Open Graph tags for social media sharing
- Twitter Card support
- Structured data (JSON-LD) for rich snippets
- XML sitemap generation
- Canonical URLs
- Geo-location tags
- Language targeting (hreflang)

## Scripts

- `npm run dev` or `npm start`: Start development server (runs on http://localhost:5173)
- `npm run build`: Build for production
- `npm run preview`: Preview the production build locally
- `npm run update-resume`: Update resume PDF from GitHub

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. See [LICENSE](LICENSE) for details.

## Links

- **Website**: [cabhinav.com](https://cabhinav.com)
- **GitHub**: [github.com/abhinav937](https://github.com/abhinav937)
- **Resume Repo**: [github.com/abhinav937/resume](https://github.com/abhinav937/resume)

## Contact

For questions or inquiries, please reach out through the contact links on the website.
