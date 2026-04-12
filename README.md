HEAD
# ApplianSys

ApplianSys is a simple appliance storefront UI with a home/search landing page,
an About page, a Cart placeholder page, and a floating AI assistant for
product and category questions.

## Features

- Home/search landing page with hero and category sections
- About page with static content
- Cart placeholder page
- Floating AI assistant widget

## Tech Stack

- React + TypeScript
- Vite (SWC) + Rollup
- Redux Toolkit + React Redux
- React Router
- MUI + Emotion

## Getting Started

```bash
npm install
```

Create a `.env` file in the project root. You can start from `.env.example`:

```bash
copy .env.example .env
```

**OpenAI (optional, for the chat widget):**

```bash
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_MODEL=gpt-4o-mini
```

**Firebase (for Sign in: email, Google, Facebook):**

1. Open [Firebase Console](https://console.firebase.google.com), create or select a project.
2. Add a **Web** app and copy the config into `.env` in the **same folder as `package.json`** (see `.env.example`). You can use either six `VITE_FIREBASE_*` lines or one `VITE_FIREBASE_CONFIG={...}` JSON line.
3. In **Build → Authentication → Sign-in method**, enable **Google**, **Facebook**, and **Email/Password** as needed.
4. For **Facebook**, add your Meta app ID and secret in the Firebase provider settings (create an app at [Meta for Developers](https://developers.facebook.com/) if you do not have one).
5. In **Authentication → Settings → Authorized domains**, include `localhost` (and your production domain when you deploy).

After editing `.env`, **restart** the dev server (`npm run start`) so Vite picks up the variables.

Then start the application:

```bash
npm run start
```

## After Pulling Latest Changes

If dependencies were recently updated, do the following to avoid errors:

```bash
# Ensure you are on Node 18+ (Node 20 is recommended)
node -v

# Reinstall dependencies from the updated lockfile
npm install
```

If you hit install or runtime issues, try a clean reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

## VS Code Extensions

Install the recommended extensions from `.vscode/extensions.json`:

```powershell
(Get-Content .vscode\extensions.json | ConvertFrom-Json).recommendations | ForEach-Object { code --install-extension $_ }
```

Force-update them to the latest versions:

```powershell
(Get-Content .vscode\extensions.json | ConvertFrom-Json).recommendations | ForEach-Object { code --install-extension $_ --force }
```

## Scripts

- `npm run start` - run the app in development mode
- `npm run lint` - run ESLint with strict warnings
- `npm run format` - format the codebase with Prettier
- `npm run build` - typecheck and build for production
- `npm run preview` - preview the production build

## Project Structure

- `src/app/` app bootstrap, providers, routing, and entry point
- `src/app/store/` Redux store setup and typed hooks
- `src/features/` feature modules and page-level components
- `src/shared/` shared styles, assets, and components
- `src/theme/` MUI theme configuration
- `public/` static assets served by Vite

## ChatGPT Assistant

- Component: `src/shared/component/ChatGPTBot.tsx`
- API: calls `https://api.openai.com/v1/chat/completions`
- Notes: messages are stored in component state only (no persistence)

See `DOCUMENTATION.md` for deeper architecture details and workflow notes.

# ApplianSys-UI-
 f0d9498ca4ac42ee41f7e75fcedadb6760c025fd
