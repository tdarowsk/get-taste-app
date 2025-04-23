# getTaste

## Project Description
getTaste is an application designed to help users easily discover personalized music and movie recommendations based on their unique tastes. It streamlines the search process by providing tailored suggestions, enabling users to quickly find content that aligns with their preferences. The app supports user registration, secure login (with 2FA), and profile management, while leveraging AI-powered algorithms alongside real-time data from Spotify to generate dynamic recommendations.

## Tech Stack
- **Frontend:** Astro 5 with React 19 for interactive components
- **Language & Tools:** TypeScript 5 for static type checking and enhanced development experience
- **Styling & UI:** Tailwind 4 and Shadcn/ui for accessible and customizable UI components
- **Backend:** Supabase (PostgreSQL database and built-in user authentication)
- **AI Integration:** Openrouter.ai for interfacing with various AI models (including OpenAI, Anthropic, Google, etc.)

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
- **User Management:** Registration, login (with 2FA), and profile editing to set music and movie preferences.
- **Recommendation Engine:** Real-time generation of tailored recommendations based on user inputs.
- **Spotify Integration:** Fetching up-to-date album and artist information via the Spotify API.
- **Automated Testing:** Incorporation of unit and end-to-end tests to ensure reliability during development.

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
