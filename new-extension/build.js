
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Building TypeAware Extension...');

try {
  // Build the extension
  console.log('📦 Running Vite build...');
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  
  // Create distribution folder
  const distPath = path.join(__dirname, 'dist');
  const packagePath = path.join(__dirname, 'typeaware-extension.zip');
  
  // Copy additional files to dist
  console.log('📋 Copying additional files...');

  const filesToCopy = [
    'content.css',
    'manifest.json',
    'README.md'
  ];

  filesToCopy.forEach(file => {
    const sourcePath = path.join(__dirname, file);
    const destPath = path.join(distPath, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file}`);
    }
  });

  // Update manifest.json paths for production
  const manifestPath = path.join(distPath, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');

    // Update content script paths
    manifestContent = manifestContent.replace(/"src\/content\.js"/g, '"content.js"');

    // Update background script path
    manifestContent = manifestContent.replace(/"src\/background\.js"/g, '"background.js"');

    fs.writeFileSync(manifestPath, manifestContent);
    console.log('✅ Updated manifest.json paths for production');
  }

  // Update popup.html script reference for production
  const popupHtmlPath = path.join(distPath, 'popup.html');
  if (fs.existsSync(popupHtmlPath)) {
    let popupHtmlContent = fs.readFileSync(popupHtmlPath, 'utf8');
    // Fix script paths for Chrome extension context (use relative paths)
    popupHtmlContent = popupHtmlContent.replace('/src/popup.jsx', './popup.js');
    popupHtmlContent = popupHtmlContent.replace('src="/popup.js"', 'src="./popup.js"');
    fs.writeFileSync(popupHtmlPath, popupHtmlContent);
    console.log('✅ Updated popup.html script reference');
  }
  
  // Copy icons folder
  const iconsSourcePath = path.join(__dirname, 'icons');
  const iconsDestPath = path.join(distPath, 'icons');
  
  if (fs.existsSync(iconsSourcePath)) {
    if (!fs.existsSync(iconsDestPath)) {
      fs.mkdirSync(iconsDestPath, { recursive: true });
    }
    
    const iconFiles = fs.readdirSync(iconsSourcePath);
    const requiredIcons = ['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png'];
    const existingIcons = iconFiles.filter(f => f.endsWith('.png'));
    
    // Copy existing icons
    iconFiles.forEach(file => {
      fs.copyFileSync(
        path.join(iconsSourcePath, file),
        path.join(iconsDestPath, file)
      );
    });
    
    // Check for missing icons
    const missingIcons = requiredIcons.filter(icon => !existingIcons.includes(icon));
    
    if (missingIcons.length > 0) {
      console.log('⚠️  WARNING: Missing icon files:', missingIcons.join(', '));
      console.log('   Extension may not load in Chrome without all 4 icons!');
      console.log('   Quick fix: Run copy-icons.bat (Windows) or ./copy-icons.sh (Mac/Linux)');
      console.log('   Or use create-icons.html to generate proper icons');
    } else {
      console.log('✅ Copied icons folder (all 4 icons present)');
    }
  } else {
    console.log('⚠️  WARNING: icons folder not found!');
  }
  
  // Create zip file (optional - for distribution)
  try {
    console.log('🗜️  Creating distribution package...');
    const archiver = require('archiver');
    
    const output = fs.createWriteStream(packagePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      const size = (archive.pointer() / 1024).toFixed(2);
      console.log(`✅ Extension packaged: ${size} KB`);
      console.log(`📦 Package created: ${packagePath}`);
    });
    
    archive.pipe(output);
    archive.directory(distPath, false);
    archive.finalize();
    
  } catch (zipError) {
    console.log('⚠️  Zip packaging failed (optional step):', zipError.message);
  }
  
  console.log('🎉 Extension build completed!');
  console.log(`📁 Build output: ${distPath}`);
  console.log('');
  console.log('📖 Installation Instructions:');
  console.log('1. Open Chrome and go to chrome://extensions/');
  console.log('2. Enable "Developer mode" in the top right');
  console.log('3. Click "Load unpacked" and select the dist folder');
  console.log('4. The TypeAware extension should now be installed!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}