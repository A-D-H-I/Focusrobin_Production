# Custom Authentication Setup

This document describes the custom email/password authentication system that has been added to FocusRobin.

## Features

✅ **Custom Login & Signup Pages**
- Beautiful, modern UI with gradient backgrounds
- Email/password authentication
- Google OAuth integration
- Facebook OAuth integration
- Password visibility toggle
- Form validation with helpful error messages
- Responsive design

✅ **Secure Password Storage**
- Passwords are hashed using bcrypt (10 rounds)
- Never stored in plain text
- Secure credential verification

✅ **NextAuth v5 Integration**
- JWT-based sessions for credentials provider
- Database sessions for OAuth providers
- Unified authentication flow

## Files Created/Modified

### New Files
1. **`src/app/signup/page.tsx`** - Signup page with email/password and OAuth options
2. **`src/app/actions/auth.ts`** - Server actions for user registration and credential verification
3. **`AUTHENTICATION_SETUP.md`** - This documentation file

### Modified Files
1. **`src/app/login/page.tsx`** - Added email/password login form
2. **`src/auth.ts`** - Added Credentials provider to NextAuth config
3. **`prisma/schema.prisma`** - Added `password` field to User model
4. **Database** - Updated with `password` column

## Usage

### Sign Up
1. Navigate to `/signup`
2. Choose between:
   - Email/password (fill in name, email, password)
   - Google OAuth (one-click)
   - Facebook OAuth (one-click)
3. For email/password, account is created and user is redirected to login

### Sign In
1. Navigate to `/login`
2. Choose between:
   - Email/password (enter credentials)
   - Google OAuth (one-click)
   - Facebook OAuth (one-click)
3. Successfully authenticated users are redirected to their intended destination

### Navigation Links
- Header contains "Login" link (redirects to `/login`)
- Login page has "Sign up" link (redirects to `/signup`)
- Signup page has "Sign in" link (redirects to `/login`)
- Both pages have "Back to home" link

## Security Features

### Password Requirements
- Minimum 6 characters
- Hashed with bcrypt (10 salt rounds)
- Passwords never exposed in API responses

### Email Validation
- Valid email format required
- Case-insensitive (stored as lowercase)
- Duplicate email prevention

### Session Management
- JWT tokens for credentials-based auth
- Secure cookie storage
- Automatic session refresh

### Error Handling
- Generic error messages to prevent user enumeration
- Specific validation errors for form fields
- OAuth error handling with user-friendly messages

## Database Schema

```prisma
model User {
  id            String     @id @default(cuid())
  email         String     @unique
  name          String?
  password      String?    // For email/password authentication
  emailVerified DateTime?
  image         String?
  role          String     @default("USER")
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  accounts      Account[]
  sessions      Session[]
  // ... other relations
}
```

## API Endpoints

### Server Actions
- `registerUser(formData)` - Creates new user account
- `verifyCredentials(email, password)` - Validates user credentials

### NextAuth Routes (automatic)
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/providers` - Get available providers

## Environment Variables

Required for full functionality:

```env
# NextAuth
AUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:9002

# Google OAuth (optional)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Facebook OAuth (optional)
AUTH_FACEBOOK_ID=your-facebook-app-id
AUTH_FACEBOOK_SECRET=your-facebook-app-secret
```

## Testing

### Test User Registration
1. Go to `http://localhost:9002/signup`
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
   - Confirm Password: test123
3. Click "Create account"
4. Should redirect to login page with success message

### Test User Login
1. Go to `http://localhost:9002/login`
2. Enter credentials:
   - Email: test@example.com
   - Password: test123
3. Click "Sign in"
4. Should redirect to home page as authenticated user

## Future Enhancements

Potential improvements:
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] Social login with more providers (Apple, Twitter, etc.)
- [ ] Password strength meter
- [ ] Account settings page
- [ ] Profile picture upload
- [ ] Remember me functionality

## Troubleshooting

### "Invalid email or password" error
- Check that the email is correct (case-insensitive)
- Verify password is at least 6 characters
- Ensure user account exists (sign up first)

### OAuth not working
- Verify environment variables are set
- Check OAuth provider configuration
- Ensure redirect URIs are configured correctly

### Session not persisting
- Clear browser cookies
- Check AUTH_SECRET is set
- Verify database connection

## Dependencies

New packages installed:
- `bcryptjs` - Password hashing
- `@types/bcryptjs` - TypeScript types for bcryptjs

Existing packages used:
- `next-auth` - Authentication framework
- `@auth/prisma-adapter` - Database adapter
- `zod` - Schema validation
- `prisma` - Database ORM

