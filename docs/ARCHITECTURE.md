# Architecture & Overview

This template implements a simple MVVM-style structure for a React Native app using TypeScript-friendly patterns.

Key ideas:
- **Screens**: in `src/screens/*` — presentational UI that uses ViewModels or hooks.
- **ViewModels**: in `src/viewmodels/*` — hooks that encapsulate business logic and call Redux thunks or services.
- **State**: global auth state in Redux Toolkit (`src/store`) persisted with `redux-persist`; onboarding state persisted using `zustand`'s `persist` middleware (`src/store/onboardingSlice.ts`).
- **Services**: network or backend APIs (mocked in `src/services/*`).
- **Navigation**: `src/navigation/AppNavigator.tsx` (native stack) with a linear onboarding flow.

Recommended packages to install:
- `@react-navigation/native`
- `@react-navigation/native-stack`
- `@reduxjs/toolkit`, `react-redux`
- `zustand`
- `react-hook-form`

Running the app (after installing deps):
- npm install
- npx pod-install ios
- npm run android / npm run ios

Next steps (ideas):
- Replace mocked `authService` with real API calls and secure storage for tokens.
- Add unit tests for viewmodels and slices.
- Add persistence (redux-persist) for auth state.
- Improve accessibility and polished UI components.
