const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const nodemailer = require('nodemailer');
const uuid = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${uuid.v4()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.zip') {
            cb(null, true);
        } else {
            cb(new Error('Only ZIP files are allowed'));
        }
    }
});

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/build', upload.single('file'), async (req, res) => {
    try {
        const { buildType, email } = req.body;
        const zipPath = req.file.path;
        const buildDir = path.join(__dirname, 'builds', uuid.v4());
        const extractDir = path.join(buildDir, 'src');
        const outputDir = path.join(__dirname, 'outputs');

        // Create directories
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true });
        }
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Extract ZIP
        console.log(`Extracting ${zipPath}...`);
        execSync(`unzip -q "${zipPath}" -d "${extractDir}"`, { maxBuffer: 1024 * 1024 * 10 });

        // Find and copy project files to build directory
        const projectFiles = fs.readdirSync(extractDir);
        for (const file of projectFiles) {
            const src = path.join(extractDir, file);
            const dest = path.join(buildDir, file);
            if (fs.lstatSync(src).isDirectory()) {
                copyDir(src, dest);
            } else {
                fs.copyFileSync(src, dest);
            }
        }

        // Setup Android environment
        console.log('Setting up Android environment...');
        const buildCommand = `cd "${buildDir}" && gradle assemble${buildType.charAt(0).toUpperCase() + buildType.slice(1)}`;

        console.log(`Running build: ${buildCommand}`);
        execSync(buildCommand, { stdio: 'inherit', maxBuffer: 1024 * 1024 * 10 });

        // Find generated APK
        const apkPattern = buildType === 'debug' 
            ? 'app/build/outputs/apk/debug/app-debug.apk'
            : 'app/build/outputs/apk/release/app-release.apk';
        
        const apkPath = path.join(buildDir, apkPattern);

        if (!fs.existsSync(apkPath)) {
            throw new Error('APK not found after build');
        }

        // Copy APK to outputs
        const outputFilename = `app-${buildType}-${Date.now()}.apk`;
        const outputPath = path.join(outputDir, outputFilename);
        fs.copyFileSync(apkPath, outputPath);

        // Send email notification
        if (email && process.env.EMAIL_USER) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: '✅ Your APK is Ready!',
                    html: `
                        <h2>Your APK Build is Complete!</h2>
                        <p>Your ${buildType} APK has been successfully built.</p>
                        <p><strong>File:</strong> ${outputFilename}</p>
                        <p><strong>Size:</strong> ${(fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2)} MB</p>
                        <p>Download your APK from the web interface or via the provided link.</p>
                        <p>Build completed at: ${new Date().toISOString()}</p>
                    `
                });
                console.log(`Email sent to ${email}`);
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }
        }

        // Cleanup
        fs.rmSync(buildDir, { recursive: true });
        fs.rmSync(zipPath);

        res.json({
            success: true,
            message: 'APK built successfully',
            downloadUrl: `/download/${outputFilename}`,
            filename: outputFilename
        });

    } catch (error) {
        console.error('Build error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Build failed'
        });
    }
});

app.get('/download/:filename', (req, res) => {
    const filepath = path.join(__dirname, 'outputs', req.params.filename);
    
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.download(filepath, (err) => {
        if (err) {
            console.error('Download error:', err);
        }
    });
});

// Utility function to copy directory
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
        const srcFile = path.join(src, file);
        const destFile = path.join(dest, file);
        if (fs.lstatSync(srcFile).isDirectory()) {
            copyDir(srcFile, destFile);
        } else {
            fs.copyFileSync(srcFile, destFile);
        }
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        success: false,
        error: err.message || 'Server error'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 APK Builder server running on http://localhost:${PORT}`);
});