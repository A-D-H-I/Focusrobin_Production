# Chat Feature Setup Guide

This guide explains how to set up the chat feature with Google Translate API integration.

## Features Implemented

1. **Chat System**: Users can send messages from the contact page
2. **Language Detection**: Automatically detects the user's language (when API is configured)
3. **Translation**: 
   - User messages are translated to English for admin
   - Admin replies are translated to the user's language
4. **Admin Interface**: Admins can view and reply to all chats

## Important Note

**The chat system works WITHOUT the translation API!** 

You can test the chat functionality immediately. Messages will be sent and received as-is (no translation). Once you configure the Google Translate API, translation will automatically be enabled.

## Prerequisites (Optional - for Translation)

1. **Google Cloud Project** with Translation API enabled
2. **Service Account** with Translation API permissions
3. **Environment Variables** configured

## Setup Steps

### 1. Create Google Cloud Project and Enable Translation API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Cloud Translation API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Cloud Translation API"
   - Click "Enable"

### 2. Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Give it a name (e.g., "translate-service")
4. Grant it the role: **Cloud Translation API User**
5. Click "Done"

### 3. Create and Download Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file

### 4. Set Environment Variables (Optional)

**You can skip this step if you want to test without translation!**

Add the following to your `.env` file when you're ready to enable translation:

```env
# Google Translate API Configuration (Optional)
GOOGLE_TRANSLATE_PROJECT_ID=your-project-id
GOOGLE_TRANSLATE_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
```

**Option 1: Direct JSON string (recommended for production)**
- Copy the entire contents of the downloaded JSON file
- Paste it as a single-line JSON string in `GOOGLE_TRANSLATE_CREDENTIALS`

**Option 2: File path (for local development)**
- Place the JSON file in your project root (e.g., `google-credentials.json`)
- Update `src/lib/translate.ts` to read from file if needed

**Note:** If these environment variables are not set, the chat will work normally without translation. You can add them later to enable translation.

### 5. Run Database Migration

**This step is required!** Run the migration to create the chat tables:

```bash
npx prisma migrate dev --name add_chat_models
```

This will create the `Chat` and `ChatMessage` tables in your database.

### 6. Generate Prisma Client

```bash
npx prisma generate
```

## Usage

### For Users

1. Navigate to the **Contact Us** page (`/contact`)
2. Click the floating chat button (bottom right)
3. Type a message in your language
4. The message will be automatically translated to English for the admin
5. Wait for admin response (which will be translated to your language)

### For Admins

1. Navigate to **Admin Dashboard** (`/admin`)
2. Click **"Chat Management"**
3. View all chats in the left panel
4. Click on a chat to view messages
5. Type your reply in English
6. The reply will be automatically translated to the user's language

## File Structure

```
src/
├── app/
│   ├── actions/
│   │   └── chat.ts              # Server actions for chat operations
│   ├── admin/
│   │   └── chats/
│   │       ├── page.tsx         # Admin chat page
│   │       └── ChatManagement.tsx  # Chat management component
│   └── contact/
│       └── page.tsx             # Contact page with chat widget
├── components/
│   └── ContactChat.tsx         # Chat widget component
└── lib/
    └── translate.ts             # Google Translate API utilities

prisma/
└── schema.prisma                # Database schema (Chat & ChatMessage models)
```

## Database Models

### Chat
- Stores conversation metadata
- Links to user (optional, for authenticated users)
- Stores user's detected language
- Tracks chat status (OPEN, CLOSED, PENDING)

### ChatMessage
- Stores individual messages
- Contains both original and translated text
- Tracks sender (USER or ADMIN)
- Stores language code

## Troubleshooting

### Translation API Errors

If you see errors like "Failed to initialize Google Translate client":
1. Verify `GOOGLE_TRANSLATE_PROJECT_ID` is set correctly
2. Verify `GOOGLE_TRANSLATE_CREDENTIALS` is valid JSON
3. Check that the service account has the correct permissions
4. Ensure the Translation API is enabled in your Google Cloud project

### Database Errors

If you see Prisma errors:
1. Run `npx prisma migrate dev` to apply migrations
2. Run `npx prisma generate` to regenerate the client
3. Restart your development server

### Chat Not Appearing

1. Check browser console for errors
2. Verify the ContactChat component is imported correctly
3. Ensure SessionProvider is in your root layout (already configured)

## Notes

- The chat widget appears as a floating button on the contact page
- Users can be anonymous (no login required)
- **Works without translation API** - you can test immediately
- When translation API is configured, translations are handled server-side for security
- Admin always types in English; translations are automatic (when API is enabled)
- User messages are detected and translated to English for admin (when API is enabled)
- Without translation API, messages are sent and received as-is

