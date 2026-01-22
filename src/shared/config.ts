import 'dotenv/config';
import { Account, RpcProvider } from 'starknet';
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

const privateKey = process.env.PRIVATE_KEY;
const address = process.env.ADDRESS;
const rpcUrl = process.env.RPC_URL;

if (!privateKey || !address || !rpcUrl) {
    console.error('Error: Faltan variables de entorno requeridas (PRIVATE_KEY, ADDRESS, RPC_URL)');
    console.log('Copia .env.example a .env y configura tus valores');
    process.exit(1);
}

export const provider = new RpcProvider({ nodeUrl: rpcUrl });

export const account = new Account({
    provider,
    address,
    signer: privateKey
});

export const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
);

// Soporta credenciales como JSON string (variable de entorno) o como archivo
let serviceAccount;
if (process.env.FIREBASE_CREDENTIALS_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
} else {
    const firebaseCredentialsPath = process.env.FIREBASE_CREDENTIALS_PATH || './firebase-credentials.json';
    serviceAccount = JSON.parse(readFileSync(join(process.cwd(), firebaseCredentialsPath), 'utf-8'));
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export { admin };
