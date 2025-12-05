require('dotenv').config();
const { google } = require('googleapis');
const { Readable } = require('stream');

async function testUpload() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  console.log('Folder ID:', folderId);
  
  let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n');
  
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  
  await auth.authorize();
  console.log('✓ Authentication successful');
  
  const drive = google.drive({ version: 'v3', auth });
  
  // First, let's check if we can list files in the folder
  console.log('Listing files in folder...');
  try {
    const listResponse = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    console.log('✓ Can list files. Count:', listResponse.data.files?.length || 0);
  } catch (err) {
    console.log('✗ Cannot list files:', err.message);
  }
  
  // Try creating with explicit writersCanShare
  console.log('Attempting upload...');
  const testContent = Buffer.from('Test invoice - ' + new Date().toISOString());
  
  try {
    const response = await drive.files.create({
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
    
    console.log('');
    console.log('✓ SUCCESS! File uploaded!');
    console.log('  File ID:', response.data.id);
    console.log('  Link:', response.data.webViewLink || 'https://drive.google.com/file/d/' + response.data.id);
    console.log('');
    console.log('Check your Google Drive folder to see the test file!');
  } catch (err) {
    console.log('✗ Upload error:', err.message);
    if (err.response?.data?.error) {
      console.log('  Reason:', err.response.data.error.message);
    }
  }
}

testUpload().catch(console.error);


