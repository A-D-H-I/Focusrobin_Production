# AI Customer Support Chatbot Setup Guide

This guide explains how to set up the AI Customer Support Chatbot powered by Google Gemini for Focus Robin Eyewear.

## Features

- **AI-Powered Support**: Chat with "Robin", an AI assistant that can answer policy questions and help with orders
- **Order Lookup**: Automatically fetch and display user's recent orders
- **Order Status Checking**: Check tracking information and order status
- **Refund Eligibility**: Automatically check if orders are eligible for refunds (14-day policy)
- **Policy Information**: Answer questions about returns, refunds, warranty, and shipping
- **Floating Chat Widget**: Beautiful chat interface accessible from any page

## Prerequisites

1. **Google Gemini API Key** (Free Tier Available)
   - Sign up at [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Get your free API key

## Setup Steps

### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Set Environment Variable

Add the following to your `.env.local` file:

```env
# Google Gemini API Key (required for AI chatbot)
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key-here
```

**Note:** The `@ai-sdk/google` package automatically looks for `GOOGLE_GENERATIVE_AI_API_KEY` environment variable.

### 3. Restart Your Development Server

After adding the environment variable, restart your Next.js development server:

```bash
npm run dev
```

## Usage

### For Customers

1. The chat widget appears as a floating button in the bottom-right corner of every page
2. Click the chat bubble to open the chat window
3. Ask questions like:
   - "What's my order status?"
   - "Can I get a refund for order ORD-2024-001?"
   - "What's your return policy?"
   - "Tell me about your warranty"
4. The AI will automatically:
   - Look up your orders (if logged in)
   - Check order status and tracking
   - Verify refund eligibility
   - Answer policy questions

### Authentication

- **Logged-in users**: Can access all features including order lookup, status checking, and refund eligibility
- **Not logged in**: Can still ask policy questions, but will be prompted to log in for order-specific queries

## AI Tools Available

The chatbot has access to these tools:

1. **lookupOrders**: Fetches the last 5 orders for the logged-in user
2. **checkOrderStatus**: Checks status and tracking for a specific order
3. **checkRefundEligibility**: Verifies if an order is eligible for refund (must be DELIVERED and < 14 days old)
4. **getPolicyInfo**: Returns information about returns, refunds, warranty, and shipping policies

## Technical Details

### Files Created

- `src/app/api/chat/route.ts` - API route handler with Google Gemini integration
- `src/components/chat/SupportChat.tsx` - Chat UI component
- Updated `src/app/layout.tsx` - Added SupportChat component

### Dependencies

- `ai` - Vercel AI SDK
- `@ai-sdk/google` - Google Gemini integration
- `@ai-sdk/react` - React hooks for AI SDK (useChat, etc.)
- `zod` - Schema validation for tools

### Model Used

- **Model**: `gemini-1.5-flash` (Free tier, fast and efficient)

## Troubleshooting

### Chat not responding

1. Check that `GOOGLE_GENERATIVE_AI_API_KEY` is set in `.env.local`
2. Verify the API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Check browser console for errors
4. Check server logs for API errors

### "Please log in" message for order queries

- This is expected behavior for users who are not logged in
- Users can still ask policy questions without logging in
- To access order features, users must be logged in

### Tool invocations not displaying

- Tool invocations (like order cards) are automatically rendered when the AI calls tools
- If you don't see formatted results, check that the tool was called successfully
- Check browser console for any rendering errors

## Free Tier Limits

Google Gemini Free Tier includes:
- **60 requests per minute** (RPM)
- **1,500 requests per day** (RPD)
- Sufficient for most small to medium e-commerce stores

For higher limits, consider upgrading to a paid plan.

## Next Steps

1. Test the chatbot by asking various questions
2. Customize the system prompt in `src/app/api/chat/route.ts` if needed
3. Add more tools if you need additional functionality
4. Monitor usage to ensure you stay within free tier limits

