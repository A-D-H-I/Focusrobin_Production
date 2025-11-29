import { Translate } from "@google-cloud/translate/build/src/v2";

// Initialize Google Translate client
let translateClient: Translate | null = null;
let isTranslationAvailable = false;

function getTranslateClient(): Translate | null {
  // Check if translation API is configured
  const credentials = process.env.GOOGLE_TRANSLATE_CREDENTIALS;
  const projectId = process.env.GOOGLE_TRANSLATE_PROJECT_ID;

  if (!credentials || !projectId) {
    // Translation API not configured - return null
    return null;
  }

  if (!translateClient) {
    try {
      // Parse credentials if it's a JSON string
      const credentialsObj =
        typeof credentials === "string"
          ? JSON.parse(credentials)
          : credentials;

      translateClient = new Translate({
        projectId,
        credentials: credentialsObj,
      });
      isTranslationAvailable = true;
    } catch (error) {
      console.error("Error initializing Google Translate client:", error);
      console.warn("Translation API not available. Chat will work without translation.");
      isTranslationAvailable = false;
      return null;
    }
  }

  return translateClient;
}

/**
 * Check if translation API is available
 */
export function isTranslationEnabled(): boolean {
  getTranslateClient(); // This will set isTranslationAvailable
  return isTranslationAvailable;
}

/**
 * Detects the language of the given text
 */
export async function detectLanguage(text: string): Promise<string> {
  const client = getTranslateClient();
  
  if (!client) {
    // Translation API not available - default to English
    return "en";
  }

  try {
    const [detection] = await client.detect(text);
    return detection.language || "en";
  } catch (error) {
    console.error("Error detecting language:", error);
    // Default to English if detection fails
    return "en";
  }
}

/**
 * Translates text from source language to target language
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string> {
  const client = getTranslateClient();
  
  if (!client) {
    // Translation API not available - return original text
    return text;
  }

  // If source and target are the same, return original
  if (sourceLanguage && sourceLanguage === targetLanguage) {
    return text;
  }

  try {
    const [translation] = await client.translate(text, {
      from: sourceLanguage,
      to: targetLanguage,
    });
    return translation as string;
  } catch (error) {
    console.error("Error translating text:", error);
    // Return original text if translation fails
    return text;
  }
}

/**
 * Translates user message to English for admin
 */
export async function translateToEnglish(
  text: string,
  sourceLanguage?: string
): Promise<string> {
  // If translation API is not available, return original text
  if (!isTranslationEnabled()) {
    return text;
  }

  // If source language is already English, return as is
  if (sourceLanguage === "en" || !sourceLanguage) {
    // Try to detect if it's actually English
    const detected = await detectLanguage(text);
    if (detected === "en") {
      return text;
    }
    return translateText(text, "en", detected);
  }
  return translateText(text, "en", sourceLanguage);
}

/**
 * Translates admin reply from English to user's language
 */
export async function translateToUserLanguage(
  text: string,
  targetLanguage: string
): Promise<string> {
  // If translation API is not available, return original text
  if (!isTranslationEnabled()) {
    return text;
  }

  // If target language is English, return as is
  if (targetLanguage === "en") {
    return text;
  }
  return translateText(text, targetLanguage, "en");
}

