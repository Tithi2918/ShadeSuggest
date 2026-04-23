# ShadeSense

AI-powered skin tone detection and makeup shade recommendation platform.

## Tech Stack
- React 18 + Vite
- Tailwind CSS v3
- MediaPipe FaceMesh (WASM)
- Vitest + React Testing Library

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Run test suite |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

## Project Structure
src/
├── cv/          # Computer vision modules
├── engine/      # Recommendation engine
├── state/       # Global app state
├── components/  # React UI components
├── hooks/       # Custom React hooks
└── utils/       # Colour math & constants
