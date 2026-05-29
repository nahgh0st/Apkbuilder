# 🚀 APK Builder

A web application to upload Google AI Studio app zips and build APKs with a beautiful, user-friendly interface.

## Features

✅ **Web Interface** - Clean, modern UI for building APKs  
✅ **Drag & Drop Upload** - Easy file uploads  
✅ **Build Types** - Support for Debug and Release APKs  
✅ **Email Notifications** - Get notified when builds complete  
✅ **Download Management** - Download built APKs directly  
✅ **Responsive Design** - Works on all devices  

## Prerequisites

- Node.js 18+
- Java Development Kit (JDK) 17+
- Android SDK with Gradle
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nahgh0st/Apkbuilder.git
   cd Apkbuilder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```
   PORT=3000
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Upload ZIP File**
   - Click the upload area or drag and drop your Google AI Studio app zip file
   - Maximum file size: 500MB

2. **Select Build Type**
   - **Debug APK**: Faster build, suitable for testing
   - **Release APK**: Optimized for production (requires signing configuration)

3. **Enter Email**
   - Provide your email to receive build notifications

4. **Build**
   - Click the "Build APK" button and wait for the build to complete
   - Download your APK or check your email for the notification

## File Structure

```
├── index.html           # Web interface
├── server.js           # Express backend server
├── package.json        # Node dependencies
├── .env.example        # Environment configuration template
├── .gitignore          # Git ignore file
├── build-apk.yml       # GitHub Actions workflow
└── README.md           # This file
```

## API Endpoints

### POST /api/build
Upload and build an APK

**Parameters:**
- `file` (multipart/form-data) - ZIP file from Google AI Studio
- `buildType` (string) - "debug" or "release"
- `email` (string) - Email for notifications

**Response:**
```json
{
  "success": true,
  "message": "APK built successfully",
  "downloadUrl": "/download/app-debug-1234567890.apk",
  "filename": "app-debug-1234567890.apk"
}
```

### GET /download/:filename
Download a built APK

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `EMAIL_SERVICE` | Email service provider | No |
| `EMAIL_USER` | Email address for sending notifications | No |
| `EMAIL_PASSWORD` | Email app password or token | No |
| `NODE_ENV` | Environment (development/production) | No |

## Email Configuration

To enable email notifications:

1. **For Gmail:**
   - Enable 2-Factor Authentication on your Gmail account
   - Generate an [App Password](https://myaccount.google.com/apppasswords)
   - Set `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`

2. **For Other Providers:**
   - Update `EMAIL_SERVICE` in `.env`
   - Modify the `transporter` configuration in `server.js` if needed

## Build Process

1. User uploads a ZIP file
2. Server extracts the ZIP file
3. Gradle builds the Android project
4. APK is generated and saved
5. Email notification is sent (if configured)
6. Cleanup temporary files

## Deployment

### Heroku
```bash
heroku create your-app-name
heroku config:set EMAIL_USER="your-email@gmail.com"
heroku config:set EMAIL_PASSWORD="your-app-password"
git push heroku main
```

### Docker
```dockerfile
FROM node:18-alpine

# Install Android SDK dependencies
RUN apk add --no-cache openjdk17 gradle bash

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Build fails with "gradle: command not found"
- Ensure Android SDK and Gradle are installed
- Add Gradle to PATH: `export PATH=$PATH:$GRADLE_HOME/bin`

### Email not sending
- Check EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASSWORD in `.env`
- For Gmail, ensure App Password is generated correctly

### APK not found after build
- Check the build log for errors
- Ensure the project structure matches the expected Gradle layout

## Security Notes

⚠️ **Important:**
- Never commit `.env` file with sensitive credentials
- Use app-specific passwords for email services
- Implement authentication if hosting publicly
- Validate file uploads thoroughly
- Consider rate limiting for public deployments

## License

MIT

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Made with ❤️ by [@nahgh0st](https://github.com/nahgh0st)
