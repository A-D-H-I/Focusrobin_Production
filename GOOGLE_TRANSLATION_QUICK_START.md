# Google Translation API - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Get Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Cloud Translation API**
4. Create a **Service Account** with **Cloud Translation API User** role
5. Download the JSON key file

### 2. Add to `.env.local`

```env
# Option 1: JSON file path (Recommended)
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# OR Option 2: Individual credentials
GOOGLE_TRANSLATE_PROJECT_ID=your-project-id
GOOGLE_TRANSLATE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_TRANSLATE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Restart Dev Server

```bash
npm run dev
```

## 📝 Usage

### Client-Side (React Component)

```typescript
const response = await fetch('/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello, world!',
    targetLanguage: 'es'
  })
});

const { translatedText } = await response.json();
console.log(translatedText); // "¡Hola, mundo!"
```

### Server-Side (Server Component or API Route)

```typescript
import { translateText } from '@/lib/translation';

const translated = await translateText('Hello, world!', 'es');
```

## 🌍 Common Language Codes

- `en` - English
- `es` - Spanish  
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean
- `ar` - Arabic

## 📚 Full Documentation

See [GOOGLE_TRANSLATION_API_SETUP.md](./GOOGLE_TRANSLATION_API_SETUP.md) for complete setup instructions.

## 🔗 API Endpoints

- `POST /api/translate` - Translate text
- `GET /api/translate?text=...` - Detect language

## ✅ Files Created

- `src/lib/translation.ts` - Translation utilities
- `src/app/api/translate/route.ts` - Translation API endpoint
- `src/lib/translation-examples.ts` - Usage examples
- `GOOGLE_TRANSLATION_API_SETUP.md` - Complete setup guide

