"use server";

import { Readable } from 'stream';

// Dynamic import for googleapis to prevent loading during server startup
async function getGoogleDriveClient() {
  console.log('[Google Drive] Initializing client...');
  
  if (!process.env.GOOGLE_DRIVE_CLIENT_EMAIL) {
    console.error('[Google Drive] GOOGLE_DRIVE_CLIENT_EMAIL is not configured');
    return null;
  }
  
  if (!process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
    console.error('[Google Drive] GOOGLE_DRIVE_PRIVATE_KEY is not configured');
    return null;
  }

  console.log(`[Google Drive] Using service account: ${process.env.GOOGLE_DRIVE_CLIENT_EMAIL}`);

  try {
    const { google } = await import('googleapis');
    
    // Process the private key - handle different formats
    let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
    
    // Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // If the key is wrapped in quotes, remove them
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    
    console.log(`[Google Drive] Private key length: ${privateKey.length} chars`);
    console.log(`[Google Drive] Private key starts with: ${privateKey.substring(0, 30)}...`);
    
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    // Test the authentication
    console.log('[Google Drive] Testing authentication...');
    await auth.authorize();
    console.log('[Google Drive] Authentication successful!');

    return google.drive({ version: 'v3', auth });
  } catch (error: any) {
    console.error('[Google Drive] Error initializing client:', error.message);
    if (error.message?.includes('invalid_grant')) {
      console.error('[Google Drive] The service account credentials may be invalid or expired');
    }
    return null;
  }
}

/**
 * Upload invoice PDF to Google Drive
 */
export async function uploadInvoiceToDrive(
  pdfBuffer: Buffer,
  fileName: string,
  folderId?: string
): Promise<{ fileId: string; webViewLink: string } | null> {
  console.log(`[Google Drive] Attempting to upload file: ${fileName}`);
  
  const drive = await getGoogleDriveClient();
  if (!drive) {
    console.warn('[Google Drive] Client not available, skipping upload');
    return null;
  }

  try {
    const fileMetadata: any = {
      name: fileName,
      mimeType: 'application/pdf',
    };

    if (folderId) {
      fileMetadata.parents = [folderId];
      console.log(`[Google Drive] Uploading to folder: ${folderId}`);
    } else {
      console.log('[Google Drive] Uploading to root (no folder specified)');
    }

    const media = {
      mimeType: 'application/pdf',
      body: Readable.from(pdfBuffer),
    };

    console.log(`[Google Drive] Creating file... (buffer size: ${pdfBuffer.length} bytes)`);
    
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    console.log(`[Google Drive] Response:`, response.data);

    if (response.data.id) {
      const result = {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
      };
      console.log(`[Google Drive] ✓ Invoice uploaded successfully: ${fileName}`);
      console.log(`[Google Drive] File ID: ${result.fileId}`);
      console.log(`[Google Drive] View Link: ${result.webViewLink}`);
      return result;
    }

    console.error('[Google Drive] Upload succeeded but no file ID returned');
    return null;
  } catch (error: any) {
    console.error('[Google Drive] Error uploading invoice:', error.message);
    if (error.response?.data) {
      console.error('[Google Drive] API Error:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

/**
 * Get the invoices folder ID
 * Uses GOOGLE_DRIVE_FOLDER_ID from env if set, otherwise tries to find/create one
 */
export async function getOrCreateInvoicesFolder(): Promise<string | null> {
  console.log('[Google Drive] Getting invoices folder...');
  
  // First check if a folder ID is provided in environment
  const envFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (envFolderId) {
    console.log(`[Google Drive] Using folder ID from env: ${envFolderId}`);
    return envFolderId;
  }
  
  console.warn('[Google Drive] GOOGLE_DRIVE_FOLDER_ID not set in .env');
  console.warn('[Google Drive] Please create a folder in YOUR Google Drive and share it with the service account');
  console.warn('[Google Drive] Then add GOOGLE_DRIVE_FOLDER_ID=<folder-id> to your .env file');
  
  // Try to find an existing folder (in case it was shared with the service account)
  const drive = await getGoogleDriveClient();
  if (!drive) {
    console.warn('[Google Drive] Client not available');
    return null;
  }

  try {
    const folderName = 'FocusRobin Invoices';
    
    // Check if folder exists (might be shared with service account)
    console.log(`[Google Drive] Searching for shared folder: ${folderName}`);
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      const folderId = response.data.files[0].id || null;
      console.log(`[Google Drive] Found shared folder: ${folderId}`);
      return folderId;
    }

    console.error('[Google Drive] No folder found. Please follow the setup instructions.');
    return null;
  } catch (error: any) {
    console.error('[Google Drive] Error finding folder:', error.message);
    if (error.response?.data) {
      console.error('[Google Drive] API Error:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

