export const downloadExtension = async () => {
  try {
    // Get the extension zip file from the public folder
    const response = await fetch('/typeaware-extension.zip');
    // In development, try the extension folder if public fails
    if (!response.ok) {
      const altResponse = await fetch('/extension/typeaware-extension.zip');
      if (!altResponse.ok) {
        throw new Error('Extension download failed');
      }
      return altResponse;
    }
    if (!response.ok) {
      throw new Error('Extension download failed');
    }

    // Convert the response to a blob
    const blob = await response.blob();
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element
    const a = document.createElement('a');
    a.href = url;
    a.download = 'typeaware-extension.zip';
    
    // Append to body, click, and remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading extension:', error);
    return false;
  }
};