require('dotenv').config();
const { google } = require('googleapis');
const { Readable } = require('stream');

async function testGoogleDriveUpload() {
  console.log('Testing Google Drive upload...');
  console.log('');
  
  // Check for folder ID
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    console.log('❌ GOOGLE_DRIVE_FOLDER_ID is not set in .env');
    console.log('');
    console.log('To fix this:');
    console.log('1. Go to drive.google.com');
    console.log('2. Create a folder called "FocusRobin Invoices"');
    console.log('3. Right-click -> Share -> Add: ' + process.env.GOOGLE_DRIVE_CLIENT_EMAIL);
    console.log('4. Open the folder and copy the ID from the URL');
    console.log('   URL looks like: drive.google.com/drive/folders/XXXXX');
    console.log('5. Add to .env: GOOGLE_DRIVE_FOLDER_ID=XXXXX');
    return;
  }
  
  console.log('Folder ID:', folderId);
  
  try {
    let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    await auth.authorize();
    console.log('✓ Authentication successful');
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Create a test file
    console.log('Uploading test file...');
    const testContent = Buffer.from('Test invoice content - ' + new Date().toISOString());
    
    const fileResponse = await drive.files.create({
      requestBody: {
        name: 'Test-Invoice-' + Date.now() + '.txt',
        parents: [folderId],
      },
      media: {
        mimeType: 'text/plain',
        body: Readable.from(testContent),
      },
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    });
    
    console.log('✓ Test file uploaded successfully!');
    console.log('  File ID:', fileResponse.data.id);
    console.log('  View Link:', fileResponse.data.webViewLink || 'https://drive.google.com/file/d/' + fileResponse.data.id + '/view');
    console.log('');
    console.log('Check your Google Drive folder to see the test file!');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    if (error.response) {
      console.error('  API Error:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.message.includes('File not found') || error.message.includes('404')) {
      console.log('');
      console.log('The folder ID might be incorrect, or the folder is not shared with:');
      console.log('  ' + process.env.GOOGLE_DRIVE_CLIENT_EMAIL);
    }
  }
}

testGoogleDriveUpload();

