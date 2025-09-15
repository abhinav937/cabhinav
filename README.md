Personal Portfolio website using HTML, CSS and JavaScript with Material Design 3 components.

## Features
- Responsive design for desktop and mobile
- Project portfolio with filtering
- Interactive navigation
- Contact links
- Resume viewer
- Dynamic publications loading

## Updating Resume

Your resume is automatically pulled from your GitHub resume repository ([abhinav937/resume](https://github.com/abhinav937/resume)).

### Manual Update
To manually update your resume PDF:

```bash
# Using npm script (if npm is available)
npm run update-resume

# Or directly run the shell script
./update-resume.sh
```

### Automatic Updates
The resume PDF will be automatically downloaded from:
`https://raw.githubusercontent.com/abhinav937/resume/main/main.pdf`

To update your resume:
1. Update the PDF in your resume repository
2. Run the update script on your website repository
3. Commit and push the changes
