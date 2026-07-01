# Contributing to ResumeAI Pro

Thank you for your interest in contributing to **ResumeAI Pro**! We welcome contributions from developers of all skill levels to help make this the best AI-powered career document platform.

## Development Setup

### Prerequisites
- **Node.js**: v18 or later
- **npm** or **yarn**
- **Docker** (optional, for running local PostgreSQL database)

### Installation

1. Clone the repository and navigate into it:
   ```bash
   git clone https://github.com/yourusername/ResumeAI-Pro.git
   cd ResumeAI-Pro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables by copying `.env.example` to `.env.local` and configuring the Supabase credentials.

4. Start the local database (if Docker is available):
   ```bash
   docker-compose up -d
   ```
   If Docker/Postgres is not running, the application will automatically activate **Self-Healing Mock DB Fallback** in-memory.

5. Start the development server:
   ```bash
   npm run dev
   ```

## Running Tests

We write automated integration and unit tests using Node's native runner. Run them with:
```bash
npm test
```

## Pull Request Guidelines

1. **Create a Branch**: Create a descriptive branch name (e.g. `feature/ats-optimizer` or `bugfix/sidebar-toggle`).
2. **Write Clean Code**: Follow our ESLint rules and maintain strict TypeScript types (avoid `any` types).
3. **Add Tests**: Ensure new logic is covered by unit or integration tests in the `tests/` directory.
4. **Pass Checks**: Verify that `npm run build` and `npm test` pass before committing.
5. **Describe Changes**: Include a comprehensive explanation in your Pull Request description, linking any related issues.
