# Project Overview

- Purpose: a simple appliance storefront UI with a home/search landing page, About page, and Cart page.
- High-level features:

  - Search (home): hero banner and category sections with a search input in the header.
  - About: static informational page.
  - Cart: static cart placeholder page.
  - Chatbot: floating ChatGPT assistant for product and category questions.

# Tech Stack

- React
- TypeScript
- Vite
- Redux Toolkit
- React-Redux

# Folder Structure

-`src/`: application source code

  -`src/app/`: app bootstrap (providers, routing, entry point)

  -`src/app/store/`: Redux store setup and typed hooks

  -`src/features/`: feature modules and page-level components

  -`src/shared/`: shared styles, assets, and components

  -`src/theme/`: MUI theme configuration

  -`src/vite-env.d.ts`: Vite TypeScript types

-`public/`: static assets served as-is (referenced by `index.html`)

-`redux/`: not present in the current layout; Redux lives in `src/app/store/`

# Application Flow

-`index.html` loads `src/app/main.tsx`.

-`src/app/main.tsx` renders `AppProviders` and then `src/app/App.tsx`.

-`src/app/App.tsx` defines routes and renders feature pages.

-`src/app/App.tsx` also renders the `ChatGPTBot` floating assistant.

- State flow: components dispatch actions -> reducers update state -> components read state via selectors.

# Redux Architecture

- Store setup: `src/app/store/index.ts`

  -`configureStore` with the root reducer.

  - Types: `RootState`, `AppDispatch`, `AppThunk`.
- Typed hooks: `src/app/store/hooks.ts` (re-exported from `@/app/store`)

  -`useAppDispatch`

  -`useAppSelector`

```ts

import { useAppDispatch, useAppSelector } from"@/app/store";


constdispatch = useAppDispatch();

constvalue = useAppSelector((state) =>state.someSlice?.value);

```

- To add a feature slice later:

  - Create the slice under `src/features/<feature>/slice/`.
  - Add it to the root reducer in `src/app/store/index.ts`.

# Components & Pages

-`src/app/App.tsx`: main layout and route definitions.

-`src/features/search/pages/SearchPage.tsx`: home/search landing page UI.

-`src/features/about/pages/AboutPage.tsx`: About page.

-`src/features/cart/pages/CartPage.tsx`: Cart page.

-`src/shared/component/ChatGPTBot.tsx`: floating chatbot widget powered by the OpenAI API.

# Chatbot (ChatGPT)

- Component: `src/shared/component/ChatGPTBot.tsx`, rendered in `src/app/App.tsx`.
- UI: floating button toggles a panel with conversation history, clear action, and a text input.
- API: calls `https://api.openai.com/v1/chat/completions` with a system prompt for the ApplianSys storefront.
- Messages: stored in component state only (no persistence).
- Errors: missing key or network issues show user-facing fallback messages.

## Chatbot Environment Variables

```bash

VITE_OPENAI_API_KEY=your_openai_api_key

VITE_OPENAI_MODEL=gpt-4o-mini

```

-`VITE_OPENAI_API_KEY` is required for requests.

-`VITE_OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`.

# Styling & Assets

- Global styles: `src/shared/styles/index.css`.
- App styles: `src/shared/styles/App.css`.
- Theme: `src/theme/index.ts` (MUI theme used in `AppProviders`).
- Images:

  -`src/shared/assets/images/category.png` imported in `src/app/App.tsx`.

  -`src/shared/assets/images/Search.png` used as a CSS background in `src/shared/styles/App.css`.
- Chatbot styles: `src/shared/styles/ChatBot.css`.

# Development Setup

```bash

npm install

npm run start

npm run build

npm run preview

npm run lint

```

# Best Practices

- Keep page-level UI in `src/features/<feature>/pages/`.
- Put shared styles/assets in `src/shared/` to avoid duplication.
- Use `useAppDispatch` and `useAppSelector` from `@/app/store`.
- Wire reducers only in `src/app/store/index.ts`.
- Avoid cross-feature imports; depend only on `shared/` or the feature itself.

# Future Improvements (Optional)

- Add feature slices under `src/features/*/slice` and compose them in the root reducer.
- Extract reusable UI into `src/shared/components/`.
- Add shared hooks/services for side effects or data fetching.
