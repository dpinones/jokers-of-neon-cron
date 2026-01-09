# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Starknet Multi-Cron system for "Jokers of Neon" - executes scheduled smart contract calls on the Starknet blockchain. Currently runs daily missions generation for the game.

## Commands

```bash
npm install    # Install dependencies
npm run build  # Compile TypeScript to dist/
npm start      # Run compiled code (dist/script.js)
npm run dev    # Build and run in one command
```

## Architecture

TypeScript Node.js application (`src/script.ts`) that:
1. Initializes Starknet account from env vars (PRIVATE_KEY, ADDRESS, RPC_URL)
2. Defines scheduled tasks in a `tasks` array with cron expressions
3. Uses node-cron to schedule and execute smart contract calls

### Project Structure
```
src/script.ts   # Main source file
dist/           # Compiled output (gitignored)
tsconfig.json   # TypeScript configuration
```

### Cron Tasks

- **Daily Missions**: Runs daily at midnight (`1 0 * * *`), calls `generate_daily_missions`
- **Notifications**: Runs every hour (`0 * * * *`), sends notifications

### Adding New Cron Tasks

Add to the `tasks` array in `src/script.ts`:
```typescript
{
    name: 'Task Name',
    schedule: '*/10 * * * *',  // Cron expression
    func: () => ejecutarFuncionPrincipal(process.env.NEW_CONTRACT_ADDRESS!)
}
```

## Environment Variables

Required in `.env` (copy from `.env.example`):
- `PRIVATE_KEY` - Starknet account private key
- `ADDRESS` - Starknet account address
- `RPC_URL` - Starknet RPC endpoint
- `DAILY_MISSION_CONTRACT_ADDRESS` - Contract for daily missions generation
- `DAILY_MISSION_CRON_SCHEDULE` - Cron expression (default: `1 0 * * *` = daily at midnight)
- `NOTIFICATIONS_CRON_SCHEDULE` - Cron expression (default: `0 * * * *` = every hour)

## Dependencies

- `starknet` (v8.1.2) - Starknet SDK
- `dotenv` - Environment variable loading
- `node-cron` - Task scheduling
- `typescript` - TypeScript compiler (dev)
