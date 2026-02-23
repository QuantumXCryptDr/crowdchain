Local Community API & IPFS Proof Uploads
=====================================

This repository includes a minimal server-backed community API used by the campaign page to persist comments, polls, and proof images.

- The API route is at `app/api/campaign/[id]/community/route.ts` and persists data to a JSON file at `.data/community.json` using `lowdb`.
- Proof images are uploaded to Web3.Storage (IPFS) when `WEB3_STORAGE_TOKEN` is provided.

To enable IPFS uploads:

1. Create a Web3.Storage account: https://web3.storage
2. Create an API token and set it in your environment (see `.env.example`):

```bash
# copy example
cp .env.example .env.local
# then edit .env.local and set:
WEB3_STORAGE_TOKEN=your_web3_storage_token_here
```

3. Restart the dev server. The campaign page will attempt to use the API; when the server has a valid token, uploaded proofs will be stored on IPFS and the UI will show an IPFS gateway URL.

Notes:
- For development this uses a JSON file under `.data/`. For production use a real DB (Supabase, Postgres, etc.) and consider batching/uploads limits for IPFS.
- If `WEB3_STORAGE_TOKEN` is not set, the UI will fall back to localStorage for proofs and community content.
