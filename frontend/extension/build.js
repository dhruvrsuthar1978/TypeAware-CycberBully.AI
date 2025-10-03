
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  
  // Copy icons folder
  const iconsSourcePath = path.join(__dirname, 'icons');
  const iconsDestPath = path.join(distPath, 'icons');
  
  if (fs.existsSync(iconsSourcePath)) {
    if (!fs.existsSync(iconsDestPath)) {
      fs.mkdirSync(iconsDestPath, { recursive: true });
    }
    
    const iconFiles = fs.readdirSync(iconsSourcePath);
    iconFiles.forEach(file => {
      fs.copyFileSync(
        path.join(iconsSourcePath, file),
        path.join(iconsDestPath, file)
      );
    });
    console.log('✅ Copied icons folder');
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