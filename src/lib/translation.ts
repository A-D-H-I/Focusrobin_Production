/**
 * Google Cloud Translation API Utility
 * 
 * Provides functions for translating text using Google Cloud Translation API
 */

import { Translate } from "@google-cloud/translate/build/src/v2";
import path from "path";
import fs from "fs";

// Initialize the Translation client
let translateClient: Translate | null = null;

/**
 * Initialize the Google Cloud Translation client
 * Uses service account credentials from environment variables
 */
function getTranslateClient(): Translate {
  if (translateClient) {
    return translateClient;
  }

  // Check if credentials are available
  let credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = process.env.GOOGLE_TRANSLATE_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_TRANSLATE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_TRANSLATE_PRIVATE_KEY;

  // If no credentials path is set, check for default location
  if (!credentialsPath) {
    const defaultCredentialsPath = path.resolve(process.cwd(), 'google-credentials.json');
    if (fs.existsSync(defaultCredentialsPath)) {
      credentialsPath = defaultCredentialsPath;
    }
  }

  if (!credentialsPath && !projectId) {
    throw new Error(
      "Google Translation API credentials not configured. " +
      "Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_TRANSLATE_PROJECT_ID in your environment variables, " +
      "or place google-credentials.json in the project root."
    );
  }

  try {
    // Option 1: Use service account JSON file
    if (credentialsPath) {
      // Resolve relative paths to absolute paths
      if (credentialsPath.startsWith('./') || credentialsPath.startsWith('../')) {
        // Resolve relative to project root (where .env.local is)
        credentialsPath = path.resolve(process.cwd(), credentialsPath);
      }
      
      // Verify file exists
      if (!fs.existsSync(credentialsPath)) {
        throw new Error(
          `Google credentials file not found at: ${credentialsPath}. ` +
          `Please check that the file exists and the path in GOOGLE_APPLICATION_CREDENTIALS is correct.`
        );
      }

      console.log(`[Translation] Using credentials file: ${credentialsPath}`);
      translateClient = new Translate({
        keyFilename: credentialsPath,
      });
    }
    // Option 2: Use individual credentials
    else if (projectId && clientEmail && privateKey) {
      translateClient = new Translate({
        projectId,
        credentials: {
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, "\n"),
        },
      });
    }
    // Option 3: Use default credentials (for GCP environments)
    else {
      translateClient = new Translate();
    }

    return translateClient;
  } catch (error) {
    console.error("Failed to initialize Google Translation client:", error);
    throw new Error(
      "Failed to initialize Google Translation API client. " +
      "Please check your credentials configuration."
    );
  }
}

/**
 * Detect the language of a text
 * @param text - The text to detect the language of
 * @returns The detected language code (e.g., 'en', 'es', 'fr')
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    const client = getTranslateClient();
    const [detection] = await client.detect(text);
    return detection.language;
  } catch (error) {
    console.error("Error detecting language:", error);
    throw new Error("Failed to detect language");
  }
}

/**
 * Translate text to a target language
 * @param text - The text to translate
 * @param targetLanguage - Target language code (e.g., 'es', 'fr', 'de')
 * @param sourceLanguage - Optional source language code (auto-detected if not provided)
 * @returns The translated text
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string> {
  try {
    if (!text || text.trim().length === 0) {
      return text;
    }

    // Don't translate if source and target are the same
    if (sourceLanguage && sourceLanguage === targetLanguage) {
      return text;
    }

    const client = getTranslateClient();
    const options: { from?: string; to: string } = {
      to: targetLanguage,
    };

    if (sourceLanguage) {
      options.from = sourceLanguage;
    }

    console.log(`[Translation] Translating "${text}" from ${sourceLanguage || 'auto'} to ${targetLanguage}`);
    const [translation] = await client.translate(text, options);
    console.log(`[Translation] Result: "${translation}"`);
    return translation;
  } catch (error) {
    console.error("Error translating text:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", errorDetails);
    throw new Error(
      `Failed to translate text: ${errorMessage}`
    );
  }
}

/**
 * Translate multiple texts to a target language
 * @param texts - Array of texts to translate
 * @param targetLanguage - Target language code (e.g., 'es', 'fr', 'de')
 * @param sourceLanguage - Optional source language code (auto-detected if not provided)
 * @returns Array of translated texts in the same order
 */
export async function translateBatch(
  texts: string[],
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string[]> {
  try {
    if (!texts || texts.length === 0) {
      return texts;
    }

    // Filter out empty texts
    const nonEmptyTexts = texts.filter((text) => text && text.trim().length > 0);
    
    if (nonEmptyTexts.length === 0) {
      return texts;
    }

    const client = getTranslateClient();
    const options: { from?: string; to: string } = {
      to: targetLanguage,
    };

    if (sourceLanguage) {
      options.from = sourceLanguage;
    }

    const [translations] = await client.translate(nonEmptyTexts, options);
    
    // Handle both single string and array responses
    const translatedArray = Array.isArray(translations) ? translations : [translations];
    
    // Map back to original array structure (preserving empty strings)
    let translationIndex = 0;
    return texts.map((text) => {
      if (!text || text.trim().length === 0) {
        return text;
      }
      return translatedArray[translationIndex++] || text;
    });
  } catch (error) {
    console.error("Error translating batch:", error);
    throw new Error(
      `Failed to translate batch: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get list of supported languages
 * @param targetLanguage - Optional language code to get language names in (e.g., 'en' for English names)
 * @returns Array of supported language codes and names
 */
export async function getSupportedLanguages(
  targetLanguage?: string
): Promise<Array<{ code: string; name: string }>> {
  try {
    const client = getTranslateClient();
    const [languages] = await client.getLanguages(targetLanguage);
    return languages.map((lang) => ({
      code: lang.code,
      name: lang.name || lang.code,
    }));
  } catch (error) {
    console.error("Error getting supported languages:", error);
    throw new Error("Failed to get supported languages");
  }
}

/**
 * Check if translation API is configured and available
 * @returns true if the API is configured, false otherwise
 */
export function isTranslationAvailable(): boolean {
  try {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.GOOGLE_TRANSLATE_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_TRANSLATE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_TRANSLATE_PRIVATE_KEY;

    // Check if credentials are set via environment variables
    if (credentialsPath || (projectId && clientEmail && privateKey)) {
      return true;
    }

    // Check if default credentials file exists (for both dev and production)
    const defaultCredentialsPath = path.resolve(process.cwd(), 'google-credentials.json');
    if (fs.existsSync(defaultCredentialsPath)) {
      return true;
    }

    // For GCP environments with default credentials
    return false;
  } catch {
    return false;
  }
}

