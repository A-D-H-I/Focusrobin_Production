require('dotenv').config();
const { Dropbox } = require('dropbox');

async function testDropboxSetup() {
  console.log('🧪 Testing Dropbox Setup...');
  console.log('');
  
  // Check environment variables
  console.log('📋 Checking environment variables...');
  const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
  const folderPath = process.env.DROPBOX_FOLDER_PATH || '/FocusRobin Invoices';
  
  if (!accessToken) {
    console.log('❌ DROPBOX_ACCESS_TOKEN is not set in .env.local');
    console.log('');
    console.log('To fix this:');
    console.log('1. Go to https://www.dropbox.com/developers/apps');
    console.log('2. Create an app or select existing one');
    console.log('3. Go to Permissions tab → Check files.content.write');
    console.log('4. Go to Settings tab → Generate access token');
    console.log('5. Add to .env.local: DROPBOX_ACCESS_TOKEN=your-token-here');
    return;
  }
  
  console.log('✓ DROPBOX_ACCESS_TOKEN is set');
  console.log(`  Token: ${accessToken.substring(0, 10)}...`);
  console.log(`  Folder: ${folderPath}`);
  console.log('');
  
  try {
    // Initialize Dropbox client with fetch for Node.js compatibility
    const dbx = new Dropbox({ accessToken, fetch });
    
    // Test connection - get account info
    console.log('🔗 Testing connection to Dropbox...');
    const accountInfo = await dbx.usersGetCurrentAccount();
    
    console.log('✓ Connected to Dropbox successfully');
    console.log(`  Account: ${accountInfo.result.name.display_name}`);
    console.log(`  Email: ${accountInfo.result.email}`);
    console.log('');

    // Check if folder exists
    console.log(`📁 Checking for folder "${folderPath}"...`);
    try {
      await dbx.filesGetMetadata({ path: folderPath });
      console.log(`✓ Folder found: ${folderPath}`);
      console.log('');
    } catch (folderError) {
      if (folderError.status === 409 && folderError.error?.error?.['.tag'] === 'path') {
        console.log(`⚠️  Folder "${folderPath}" not found`);
        console.log('   Creating folder...');
        
        const createResponse = await dbx.filesCreateFolderV2({
          path: folderPath,
          autorename: false,
        });
        
        console.log('✓ Folder created successfully');
        console.log(`  Path: ${createResponse.result.metadata.path_display}`);
        console.log('');
      } else {
        throw folderError;
      }
    }

    // Test file upload
    console.log('📤 Testing file upload...');
    const testContent = Buffer.from('Test invoice content - ' + new Date().toISOString());
    const testFileName = 'Test-Invoice-' + Date.now() + '.txt';
    const testFilePath = `${folderPath}/${testFileName}`;
    
    const uploadResponse = await dbx.filesUpload({
      path: testFilePath,
      contents: testContent,
      mode: { '.tag': 'add' },
      autorename: true,
    });
    
    console.log('✓ Test file uploaded successfully');
    console.log(`  File ID: ${uploadResponse.result.id}`);
    console.log(`  File Name: ${uploadResponse.result.name}`);
    console.log(`  Path: ${uploadResponse.result.path_display}`);
    console.log('');
    
    // Try to create a shared link
    console.log('🔗 Creating shared link...');
    try {
      const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: uploadResponse.result.path_lower,
        settings: {
          requested_visibility: { '.tag': 'public' },
        },
      });
      
      console.log('✓ Shared link created');
      console.log(`  Link: ${linkResponse.result.url}`);
      console.log('');
    } catch (linkError) {
      if (linkError.error?.error?.['.tag'] === 'shared_link_already_exists') {
        const existingLinks = await dbx.sharingListSharedLinks({
          path: uploadResponse.result.path_lower,
          direct_only: true,
        });
        
        if (existingLinks.result.links && existingLinks.result.links.length > 0) {
          console.log('✓ Using existing shared link');
          console.log(`  Link: ${existingLinks.result.links[0].url}`);
          console.log('');
        }
      } else {
        console.log('⚠️  Could not create shared link (this is optional)');
        console.log('');
      }
    }
    
    console.log('✅ All tests passed!');
    console.log('');
    console.log('Dropbox is configured correctly and ready to use.');
    console.log(`Check your Dropbox folder "${folderPath}" to see the test file.`);
    
  } catch (error) {
    console.log('');
    console.log('❌ Error:', error.message);
    
    if (error.status === 401) {
      console.log('');
      console.log('Authentication failed. Check:');
      console.log('  1. DROPBOX_ACCESS_TOKEN is correct');
      console.log('  2. The token hasn\'t been revoked');
      console.log('  3. The token hasn\'t expired');
    } else if (error.status === 403) {
      console.log('');
      console.log('Permission denied. Make sure:');
      console.log('  1. The app has "files.content.write" permission');
      console.log('  2. The app has "files.content.read" permission');
      console.log('  3. Go to your app settings and enable these permissions');
    } else if (error.status === 409) {
      console.log('');
      console.log('Path conflict. This could mean:');
      console.log('  1. The path is invalid');
      console.log('  2. A file already exists with that name');
      console.log('  3. Parent folder doesn\'t exist');
    }
    
    if (error.error) {
      console.log('');
      console.log('Error details:', JSON.stringify(error.error, null, 2));
    }
  }
}

testDropboxSetup();

