# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a serverless Starknet cron job deployed on Vercel. It executes automatic transactions on Starknet contracts at scheduled intervals using Vercel's cron functionality.

## Architecture

- **Serverless Function**: Single endpoint at [api/cron.js](api/cron.js) that acts as the cron handler
- **Starknet Integration**: Uses starknet.js library to interact with Starknet contracts
- **Security**: Validates requests come from Vercel Cron via user-agent header check
- **Deployment**: Configured for Vercel with [vercel.json](vercel.json) defining cron schedules

## Environment Variables

Required environment variables (set in Vercel dashboard):
- `PRIVATE_KEY`: Starknet account private key
- `ADDRESS`: Starknet account address
- `RPC_URL`: Starknet RPC endpoint URL
- `CRON1_CONTRACT_ADDRESS`: Target contract address for cron job

## Development Commands

### Local Testing
```bash
# Install Vercel CLI
npm i -g vercel

# Start local development server
vercel dev

# Test the cron endpoint locally
curl http://localhost:3000/api/cron -H "user-agent: vercel-cron/1.0"
```

### Deployment
```bash
# Deploy to production
vercel --prod

# Add environment variables
vercel env add PRIVATE_KEY
vercel env add ADDRESS
vercel env add RPC_URL
vercel env add CRON1_CONTRACT_ADDRESS
```

## Cron Configuration

The cron schedule is defined in [vercel.json](vercel.json):
- Current schedule: `*/1 * * * *` (every minute for testing)
- Production recommendation: `0 6 * * *` (daily at 06:00 UTC)
- Vercel Hobby plan limits: max 2 cron jobs, 10-second function timeout

## Contract Interaction

The cron job executes a transaction on a Starknet contract:
- Default entrypoint: `increase_balance`
- Default calldata: `[5]`
- Modify these in [api/cron.js](api/cron.js) in the `myCall` object

## Monitoring

- View logs: Vercel Dashboard → Project → Functions → `/api/cron`
- Transaction verification: Check Starkscan with returned transaction hash
- Function returns transaction hash and Starkscan URL on success
