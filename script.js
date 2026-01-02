require('dotenv').config();
const { Account, RpcProvider } = require('starknet');
const cron = require('node-cron');

const privateKey = process.env.PRIVATE_KEY;
const address = process.env.ADDRESS;
const rpcUrl = process.env.RPC_URL;

// Verificar que las variables de entorno estén configuradas
if (!privateKey || !address || !rpcUrl) {
    console.error('Error: Faltan variables de entorno requeridas (PRIVATE_KEY, ADDRESS, RPC_URL)');
    console.log('Copia .env.example a .env y configura tus valores');
    process.exit(1);
}

const provider = new RpcProvider({ nodeUrl: rpcUrl });
const account = new Account({
    provider,
    address,
    signer: privateKey
});

// Funci�n principal (ejemplo: invocar transfer)
async function ejecutarFuncionPrincipal(contractAddress) {
    try {
        const myCall = {
            contractAddress: contractAddress,
            entrypoint: 'generate_daily_missions',
            calldata: []
        };
        const nonce = await account.getNonce();
        const { transaction_hash } = await account.execute(myCall, {
            nonce,
        });
        console.log(`tx: ${transaction_hash}`);
    } catch (error) {
        console.error('Error en funci�n principal:', error);
    }
}

// Configura m�ltiples tasks (agrega m�s si necesitas)
const tasks = [
    {
        name: 'Cron1 - Principal',
        schedule: '1 6 * * *',
        func: () => ejecutarFuncionPrincipal(process.env.CRON1_CONTRACT_ADDRESS)
    },
];

tasks.forEach(task => {
    cron.schedule(task.schedule, task.func);
    console.log(`${task.name} programado: ${task.schedule}`);
});

console.log('Todos los crons iniciados. Proceso corriendo...');