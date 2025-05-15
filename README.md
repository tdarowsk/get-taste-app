# getTaste - Discover personalized music and movie recommendations

getTaste is a web application that leverages AI to provide personalized music and movie recommendations based on your individual preferences. The platform includes user registration, secure login through Supabase Auth, and profile management, while leveraging AI-powered algorithms alongside real-time data from Spotify to generate dynamic recommendations.

## Project Description

getTaste is an application designed to help users easily discover personalized music and movie recommendations based on their unique tastes. It streamlines the search process by providing tailored suggestions, enabling users to quickly find content that aligns with their preferences. The app supports user registration, secure login through Supabase Auth, and profile management, while leveraging AI-powered algorithms alongside real-time data from Spotify to generate dynamic recommendations.

## Tech Stack

- **Frontend:** Astro 5 with React 19 for interactive components
- **Language & Tools:** TypeScript 5 for static type checking and enhanced development experience
- **Styling & UI:** Tailwind 4 and Shadcn/ui for accessible and customizable UI components
- **Backend:** Supabase (PostgreSQL database and built-in user authentication)
- **AI Integration:** Openrouter.ai for interfacing with various AI models (including OpenAI, Anthropic, Google, etc.)
- **Testing (unit tests):** Vitest
- **Testing (end-to-end tests):** Playwright

## Getting Started Locally

### Prerequisites

- **Node.js:** Version specified in the `.nvmrc` file **(v22.14.0)**
- **npm:** Comes with Node.js

### Installation

1. **Clone the repository:**
   git clone https://github.com/tdarowsk/get-taste-app
   cd get-taste
2. **Install the dependencies:**
   npm install
3. **Start the development server:**
   npm run dev

## Available Scripts

- `npm run dev` - Launch the development server.
- `npm run build` - Build the production-ready version of the app.
- `npm run preview` - Preview the production build locally.
- `npm run astro` - Access Astro CLI commands.
- `npm run lint` - Run ESLint to check for code quality issues.
- `npm run lint:fix` - Automatically fix linting issues.
- `npm run format` - Format project files using Prettier.

## Project Scope

The MVP focuses on delivering the core functionality of generating personalized music and movie recommendations. Key features include:

- **User Management:** Registration, login through Supabase Auth, and profile editing to set music and movie preferences.
- **Recommendation Engine:** Real-time generation of tailored recommendations based on user inputs.
- **Spotify Integration:** Fetching up-to-date album and artist information via the Spotify API.
- **Automated Testing:** Incorporation of unit tests (Vitest) and end-to-end tests (Playwright) to ensure reliability during development.

**Excluded Functionality:**

- Rating or feedback systems (e.g., like/dislike buttons)
- Social features such as friend connections or content sharing
- Advanced filtering options or detailed UI personalizations
- AI-driven chat or dynamic conversation features

## Project Status

This project is currently in its MVP phase and under active development.

## License

This project is licensed under the MIT License.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Features

- **Personalized Recommendations:** Get AI-generated recommendations for music and movies based on your preferences.
- **Preference Management:** Set and update your preferences for music genres, artists, movie genres, directors, and more.
- **User Management:** Registration, login through Supabase Auth, and profile editing to set music and movie preferences.
- **Spotify Integration:** Connect with Spotify to enhance your music recommendations.
- **Recommendation Feedback:** "Swipe" system to like or dislike recommendations, improving future suggestions.
- **History Tracking:** View your past recommendations and feedback history.

## Konfiguracja zmiennych środowiskowych

Aplikacja wymaga następujących zmiennych środowiskowych, które należy umieścić w pliku `.env` w głównym katalogu projektu:

```bash
# Supabase environment variables (server-side)
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_KEY=your-supabase-service-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Supabase environment variables (client-side)
PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenRouter API configuration
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_API_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=qwen/qwen3-235b-a22b:free

# External APIs
TMDB_API_KEY=your-tmdb-api-key
OMDB_API_KEY=your-omdb-api-key
SPOTIFY_CLIENT_ID=your-spotify-client-id

# Server configuration (for Docker/production)
HOST=0.0.0.0
PORT=8080
NODE_ENV=production
```

### Środowisko deweloperskie

Dla środowiska deweloperskiego, skopiuj plik `.env.example` do `.env` i uzupełnij wymagane zmienne:

```bash
cp .env.example .env
```

### Środowisko produkcyjne

W środowisku produkcyjnym (Docker/DigitalOcean) zmienne środowiskowe powinny być ustawione przez system zarządzania konfiguracją lub platformę hostingową.

### Środowisko testowe

Dla testów E2E, stwórz plik `.env.test` z następującą konfiguracją:

```bash
# Supabase credentials for tests
SUPABASE_URL=<Twój URL Supabase>
SUPABASE_KEY=<Twój klucz API Supabase>
SUPABASE_SERVICE_ROLE_KEY=<Twój klucz Service Role>

# Test user credentials
E2E_USERNAME=<testowy email>
E2E_PASSWORD=<testowe hasło>

# Base URL for tests
BASE_URL=http://localhost:3000

# Disable auth for E2E tests
DISABLE_AUTH=true
```

**WAŻNE**: 
- Nigdy nie commituj plików `.env`, `.env.test` ani rzeczywistych kluczy do repozytorium
- Używaj różnych kluczy dla środowisk produkcyjnego, deweloperskiego i testowego
- Regularnie rotuj klucze API w środowisku produkcyjnym
- Używaj ograniczonych uprawnień dla kluczy w środowisku deweloperskim

## Testy E2E

### Konfiguracja testów E2E

Testy E2E wymagają prawidłowej konfiguracji zmiennych środowiskowych. Stwórz plik `.env.test` w głównym katalogu projektu i ustaw następujące zmienne:

```
# Supabase credentials for tests
SUPABASE_URL=<Twój URL Supabase>
SUPABASE_KEY=<Twój klucz API Supabase>

# Test user credentials
E2E_USERNAME=<testowy email>
E2E_PASSWORD=<testowe hasło>

# Base URL for tests
BASE_URL=http://localhost:3000
```

**WAŻNE**: Nigdy nie umieszczaj prawdziwych kluczy API ani danych uwierzytelniających w kodzie, plikach konfiguracyjnych przechowywanych w repozytorium, ani w skryptach package.json. Zawsze używaj plików środowiskowych (`.env.test`) ignorowanych przez system kontroli wersji.

## Testing

You can run automated tests with the following commands:

- `npm run test` - Run all tests (unit and e2e).
- `npm run test:unit` - Run unit tests with Vitest.
- `npm run test:unit:watch` - Run unit tests in watch mode with Vitest.
- `npm run test:e2e` - Run end-to-end tests with Playwright.

Unit tests are located alongside your React components in `src/` with `.test.ts` or `.test.tsx` extensions. E2E tests are stored under `tests/e2e/` using the Playwright Page Object Model.
