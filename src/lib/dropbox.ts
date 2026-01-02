"use server";

import { Dropbox } from 'dropbox';

/**
 * Get Dropbox client with access token
 * Note: We pass fetch explicitly for Node.js server environment compatibility
 */
async function getDropboxClient() {
  console.log('[Dropbox] Initializing client...');
  
  const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('[Dropbox] DROPBOX_ACCESS_TOKEN not set in environment');
    console.error('[Dropbox] Generate an access token at: https://www.dropbox.com/developers/apps');
    return null;
  }

  try {
    // Pass fetch explicitly for Node.js server environment
    const dbx = new Dropbox({ 
      accessToken,
      fetch: fetch, // Use global fetch (available in Node.js 18+)
    });
    console.log('[Dropbox] Client initialized successfully');
    return dbx;
  } catch (error: any) {
    console.error('[Dropbox] Error initializing client:', error.message);
    return null;
  }
}

/**
 * Upload invoice PDF to Dropbox
 * @param pdfBuffer - PDF file as Buffer
 * @param fileName - Name for the file
 * @param folderPath - Optional folder path (defaults to /FocusRobin Invoices)
 * @returns Object with file ID and shared link, or null if failed
 */
export async function uploadInvoiceToDropbox(
  pdfBuffer: Buffer,
  fileName: string,
  folderPath?: string
): Promise<{ fileId: string; sharedLink: string } | null> {
  console.log(`[Dropbox] Attempting to upload file: ${fileName}`);
  
  const dbx = await getDropboxClient();
  if (!dbx) {
    const errorMsg = '[Dropbox] Client not available, skipping upload. Check DROPBOX_ACCESS_TOKEN environment variable.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    // Determine upload path
    const folder = folderPath || process.env.DROPBOX_FOLDER_PATH || '/FocusRobin Invoices';
    const filePath = `${folder}/${fileName}`;
    
    console.log(`[Dropbox] Uploading to: ${filePath}`);
    console.log(`[Dropbox] File size: ${pdfBuffer.length} bytes`);

    // Upload the file
    const uploadResponse = await dbx.filesUpload({
      path: filePath,
      contents: pdfBuffer,
      mode: { '.tag': 'add' },
      autorename: true,
      mute: false,
    });

    if (uploadResponse.result) {
      console.log(`[Dropbox] ✓ File uploaded successfully`);
      console.log(`[Dropbox] File ID: ${uploadResponse.result.id}`);
      console.log(`[Dropbox] Path: ${uploadResponse.result.path_display}`);

      // Try to create a shared link
      let sharedLink = '';
      try {
        const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
          path: uploadResponse.result.path_lower || filePath,
          settings: {
            requested_visibility: { '.tag': 'public' },
          },
        });
        
        if (linkResponse.result && linkResponse.result.url) {
          sharedLink = linkResponse.result.url;
          console.log(`[Dropbox] ✓ Shared link created: ${sharedLink}`);
        }
      } catch (linkError: any) {
        // If link already exists, try to get it
        if (linkError.error?.error?.['.tag'] === 'shared_link_already_exists') {
          try {
            const existingLinks = await dbx.sharingListSharedLinks({
              path: uploadResponse.result.path_lower || filePath,
              direct_only: true,
            });
            
            if (existingLinks.result.links && existingLinks.result.links.length > 0) {
              sharedLink = existingLinks.result.links[0].url;
              console.log(`[Dropbox] ✓ Using existing shared link: ${sharedLink}`);
            }
          } catch (getError: any) {
            console.warn('[Dropbox] Could not get existing shared link:', getError.message);
          }
        } else {
          console.warn('[Dropbox] Could not create shared link:', linkError.message);
        }
      }

      return {
        fileId: uploadResponse.result.id,
        sharedLink: sharedLink || `https://www.dropbox.com/home${uploadResponse.result.path_display}`,
      };
    }

    const errorMsg = '[Dropbox] Upload succeeded but no result returned';
    console.error(errorMsg);
    throw new Error(errorMsg);
  } catch (error: any) {
    console.error('[Dropbox] Error uploading invoice:', error.message);
    
    if (error.status === 401) {
      const errorMsg = 'Dropbox authentication failed. Check your DROPBOX_ACCESS_TOKEN. Token may be invalid or expired.';
      console.error(`[Dropbox] ${errorMsg}`);
      throw new Error(errorMsg);
    } else if (error.status === 403) {
      const errorMsg = 'Dropbox permission denied. Make sure the token has files.content.write permission.';
      console.error(`[Dropbox] ${errorMsg}`);
      throw new Error(errorMsg);
    } else if (error.status === 409) {
      const errorMsg = `Dropbox path error. The folder "${folderPath || process.env.DROPBOX_FOLDER_PATH || '/FocusRobin Invoices'}" might not exist or path is invalid.`;
      console.error(`[Dropbox] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    if (error.error) {
      console.error('[Dropbox] Error details:', JSON.stringify(error.error, null, 2));
    }
    
    // Re-throw the error so it can be caught and logged by the caller
    throw error;
  }
}

/**
 * Get or create the invoices folder in Dropbox
 * @returns Folder path or null if failed
 */
export async function getOrCreateInvoicesFolder(): Promise<string | null> {
  console.log('[Dropbox] Getting/creating invoices folder...');
  
  const dbx = await getDropboxClient();
  if (!dbx) {
    const errorMsg = '[Dropbox] Client not available. Check DROPBOX_ACCESS_TOKEN environment variable.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const folderPath = process.env.DROPBOX_FOLDER_PATH || '/FocusRobin Invoices';
  
  try {
    // Check if folder exists
    try {
      await dbx.filesGetMetadata({ path: folderPath });
      console.log(`[Dropbox] ✓ Folder exists: ${folderPath}`);
      return folderPath;
    } catch (checkError: any) {
      if (checkError.status === 409 && checkError.error?.error?.['.tag'] === 'path' && 
          checkError.error?.error?.path?.['.tag'] === 'not_found') {
        console.log(`[Dropbox] Folder "${folderPath}" does not exist, creating it...`);
      } else {
        throw checkError;
      }
    }

    // Create folder if it doesn't exist
    const createResponse = await dbx.filesCreateFolderV2({
      path: folderPath,
      autorename: false,
    });

    if (createResponse.result) {
      console.log(`[Dropbox] ✓ Folder created: ${folderPath}`);
      return folderPath;
    }

    const errorMsg = '[Dropbox] Failed to create folder - no result returned';
    console.error(errorMsg);
    throw new Error(errorMsg);
  } catch (error: any) {
    console.error('[Dropbox] Error getting/creating folder:', error.message);
    
    if (error.status === 401) {
      const errorMsg = 'Dropbox authentication error. Check your DROPBOX_ACCESS_TOKEN. Token may be invalid or expired.';
      console.error(`[Dropbox] ${errorMsg}`);
      throw new Error(errorMsg);
    } else if (error.status === 403) {
      const errorMsg = 'Dropbox permission error. Token needs files.content.write permission.';
      console.error(`[Dropbox] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // Re-throw the error so it can be caught and logged by the caller
    throw error;
  }
}

/**
 * Test Dropbox connection and permissions
 * @returns true if connection is successful
 */
export async function testDropboxConnection(): Promise<boolean> {
  console.log('[Dropbox] Testing connection...');
  
  const dbx = await getDropboxClient();
  if (!dbx) {
    return false;
  }

  try {
    // Get account info to test connection
    const accountInfo = await dbx.usersGetCurrentAccount();
    
    if (accountInfo.result) {
      console.log(`[Dropbox] ✓ Connection successful`);
      console.log(`[Dropbox] Account: ${accountInfo.result.name.display_name}`);
      console.log(`[Dropbox] Email: ${accountInfo.result.email}`);
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('[Dropbox] Connection test failed:', error.message);
    
    if (error.status === 401) {
      console.error('[Dropbox] Invalid access token');
    }
    
    return false;
  }
}
