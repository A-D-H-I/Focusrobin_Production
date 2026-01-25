/**
 * Google Translation API Usage Examples
 * 
 * This file contains example code showing how to use the translation utilities.
 * These are examples only - copy and adapt as needed for your use case.
 */

import { translateText, translateBatch, detectLanguage, getSupportedLanguages } from "./translation";

// ============================================================================
// Example 1: Basic Translation (Server-Side)
// ============================================================================

export async function exampleBasicTranslation() {
  try {
    // Translate a single text
    const translated = await translateText("Hello, world!", "es");
    console.log(translated); // "¡Hola, mundo!"
    
    return translated;
  } catch (error) {
    console.error("Translation failed:", error);
    throw error;
  }
}

// ============================================================================
// Example 2: Translation with Source Language
// ============================================================================

export async function exampleTranslationWithSource() {
  try {
    // Specify source language for better accuracy
    const translated = await translateText(
      "Bonjour le monde!",
      "en", // Target: English
      "fr"  // Source: French
    );
    console.log(translated); // "Hello world!"
    
    return translated;
  } catch (error) {
    console.error("Translation failed:", error);
    throw error;
  }
}

// ============================================================================
// Example 3: Batch Translation
// ============================================================================

export async function exampleBatchTranslation() {
  try {
    const texts = [
      "Hello",
      "Goodbye",
      "Thank you",
      "Please",
      "Yes",
      "No"
    ];
    
    // Translate all texts to German
    const translations = await translateBatch(texts, "de");
    console.log(translations);
    // Output: ["Hallo", "Auf Wiedersehen", "Danke", "Bitte", "Ja", "Nein"]
    
    return translations;
  } catch (error) {
    console.error("Batch translation failed:", error);
    throw error;
  }
}

// ============================================================================
// Example 4: Language Detection
// ============================================================================

export async function exampleLanguageDetection() {
  try {
    const text = "Hola, ¿cómo estás?";
    const detected = await detectLanguage(text);
    console.log(detected); // "es"
    
    return detected;
  } catch (error) {
    console.error("Language detection failed:", error);
    throw error;
  }
}

// ============================================================================
// Example 5: Get Supported Languages
// ============================================================================

export async function exampleGetSupportedLanguages() {
  try {
    // Get all supported languages with English names
    const languages = await getSupportedLanguages("en");
    console.log(languages);
    // Output: [
    //   { code: "en", name: "English" },
    //   { code: "es", name: "Spanish" },
    //   { code: "fr", name: "French" },
    //   ...
    // ]
    
    return languages;
  } catch (error) {
    console.error("Failed to get supported languages:", error);
    throw error;
  }
}

// ============================================================================
// Example 6: Client-Side API Usage (React Component)
// ============================================================================

/**
 * Example React component using the translation API
 * 
 * Usage in a React component:
 * 
 * ```tsx
 * 'use client';
 * 
 * import { useState } from 'react';
 * 
 * export function TranslationExample() {
 *   const [text, setText] = useState('');
 *   const [translated, setTranslated] = useState('');
 *   const [loading, setLoading] = useState(false);
 *   const [targetLang, setTargetLang] = useState('es');
 * 
 *   const handleTranslate = async () => {
 *     setLoading(true);
 *     try {
 *       const response = await fetch('/api/translate', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({
 *           text: text,
 *           targetLanguage: targetLang,
 *         }),
 *       });
 * 
 *       const data = await response.json();
 *       if (data.error) {
 *         console.error(data.error);
 *       } else {
 *         setTranslated(data.translatedText);
 *       }
 *     } catch (error) {
 *       console.error('Translation failed:', error);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <textarea
 *         value={text}
 *         onChange={(e) => setText(e.target.value)}
 *         placeholder="Enter text to translate"
 *       />
 *       <select
 *         value={targetLang}
 *         onChange={(e) => setTargetLang(e.target.value)}
 *       >
 *         <option value="es">Spanish</option>
 *         <option value="fr">French</option>
 *         <option value="de">German</option>
 *         <option value="it">Italian</option>
 *       </select>
 *       <button onClick={handleTranslate} disabled={loading}>
 *         {loading ? 'Translating...' : 'Translate'}
 *       </button>
 *       {translated && <p>Translated: {translated}</p>}
 *     </div>
 *   );
 * }
 * ```
 */

// ============================================================================
// Example 7: Server Action Usage
// ============================================================================

/**
 * Example server action using translation
 * 
 * Create a file: src/app/actions/translation.ts
 * 
 * ```typescript
 * 'use server';
 * 
 * import { translateText } from '@/lib/translation';
 * import { safeAction } from '@/lib/security';
 * 
 * export async function translateProductDescription(
 *   description: string,
 *   targetLanguage: string
 * ) {
 *   return safeAction(async () => {
 *     const translated = await translateText(description, targetLanguage);
 *     return { translated };
 *   });
 * }
 * ```
 */

// ============================================================================
// Example 8: API Route Usage (Client-Side)
// ============================================================================

/**
 * Example function for client-side API calls
 */
export async function translateViaAPI(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string> {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Translation failed");
    }

    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error("Translation API error:", error);
    throw error;
  }
}

/**
 * Example function for batch translation via API
 */
export async function translateBatchViaAPI(
  texts: string[],
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string[]> {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texts,
        targetLanguage,
        sourceLanguage,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Batch translation failed");
    }

    const data = await response.json();
    return data.translations;
  } catch (error) {
    console.error("Batch translation API error:", error);
    throw error;
  }
}

/**
 * Example function for language detection via API
 */
export async function detectLanguageViaAPI(text: string): Promise<string> {
  try {
    const response = await fetch(
      `/api/translate?text=${encodeURIComponent(text)}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Language detection failed");
    }

    const data = await response.json();
    return data.language;
  } catch (error) {
    console.error("Language detection API error:", error);
    throw error;
  }
}

