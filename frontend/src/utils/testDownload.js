import { downloadExtension } from './extensionDownload';

// Test the download function
async function testDownload() {
  console.log('Testing extension download...');
  try {
    const success = await downloadExtension();
    console.log('Download result:', success ? 'Success' : 'Failed');
  } catch (error) {
    console.error('Download error:', error);
  }
}

testDownload();