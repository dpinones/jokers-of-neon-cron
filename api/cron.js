import { Account, RpcProvider } from 'starknet';

export default async function handler(req, res) {
    // Verificar que la petición venga de Vercel Cron (deshabilitado para desarrollo local)
    if (req.headers['user-agent'] !== 'vercel-cron/1.0') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    const privateKey = process.env.PRIVATE_KEY;
    const address = process.env.ADDRESS;
    const rpcUrl = process.env.RPC_URL;
    const contractAddress = process.env.CRON1_CONTRACT_ADDRESS;

    // Verificar variables de entorno
    if (!privateKey || !address || !rpcUrl || !contractAddress) {
        console.error('Error: Faltan variables de entorno requeridas');
        return res.status(500).json({
            error: 'Configuración incompleta',
            message: 'Faltan variables de entorno requeridas (PRIVATE_KEY, ADDRESS, RPC_URL, CRON1_CONTRACT_ADDRESS)'
        });
    }

    try {
        console.log('Iniciando cron job a las:', new Date().toISOString());

        const provider = new RpcProvider({ nodeUrl: rpcUrl });
        const account = new Account(provider, address, privateKey);

        // Ejecutar la función principal
        const myCall = {
            contractAddress: contractAddress,
            entrypoint: 'increase_balance',
            calldata: [5]
        };

        const { transaction_hash } = await account.execute(myCall);
        const txUrl = `https://starkscan.co/tx/${transaction_hash}`;

        console.log('Transacción ejecutada:', txUrl);

        return res.status(200).json({
            success: true,
            message: 'Cron job completado con éxito',
            transaction_hash,
            tx_url: txUrl,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en cron job:', error);
        return res.status(500).json({
            error: 'Error en cron job',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
