# Starknet Multi-Cron

Sistema de tareas programadas (crons) para interactuar con la blockchain de Starknet. Permite ejecutar múltiples funciones de smart contracts de forma automatizada con intervalos configurables.

## Características

- **Multi-cron**: Soporte para múltiples tareas programadas con diferentes intervalos
- **Starknet Integration**: Ejecuta transacciones y monitorea balances en Starknet
- **Configuración flexible**: Intervalos y parámetros configurables via variables de entorno
- **Deploy en Render**: Optimizado para ejecutarse como Background Worker en Render

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

## Configuración

Edita el archivo `.env` con tus valores:

```env
# Configuración de cuenta Starknet
PRIVATE_KEY=0xtu_clave_privada
ADDRESS=0xtu_direccion
RPC_URL=https://rpc.starknet-testnet.lava.build

# Configuración de crons
CRON1_INTERVAL_MINUTES=5
CRON1_CONTRACT_ADDRESS=0xcontrato1
```

### Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PRIVATE_KEY` | Clave privada de tu cuenta Starknet | `0x123...` |
| `ADDRESS` | Dirección de tu cuenta Starknet | `0x456...` |
| `RPC_URL` | Endpoint RPC de Starknet | `https://rpc.starknet-testnet.lava.build` |
| `CRON1_INTERVAL_MINUTES` | Intervalo en minutos para el primer cron | `5` |
| `CRON1_CONTRACT_ADDRESS` | Contrato específico para el primer cron | `0xabc...` |

## Uso

```bash
# Ejecutar el sistema de crons
npm start
```

El sistema iniciará todos los crons configurados y mantendrá el proceso corriendo para ejecutar las tareas programadas.

## Arquitectura

- **script.js**: Archivo principal que contiene la lógica de crons y funciones de Starknet
- **package.json**: Configuración del proyecto y dependencias
- **.env**: Variables de entorno (crear desde .env.example)

### Funciones Disponibles

- `ejecutarFuncionPrincipal()`: Ejecuta la función `increase_balance` en el contrato especificado
- Fácilmente extensible para agregar más funciones según necesidades

## Dependencias

- **starknet**: SDK para interactuar con Starknet
- **dotenv**: Gestión de variables de entorno
- **node-cron**: Programación de tareas

## Deploy en Render

1. Conecta tu repositorio Git a Render
2. Crea un nuevo **Background Worker**
3. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Agrega todas las variables del archivo .env

## Desarrollo

Para agregar nuevas tareas cron, modifica el array `tasks` en `script.js`:

```javascript
const tasks = [
    {
        name: 'Mi Nueva Tarea',
        schedule: '*/10 * * * *', // Cada 10 minutos
        func: () => miFuncion()
    }
];
```

## Formato de Schedule

El formato de cron usa la sintaxis estándar:
- `*/5 * * * *` - Cada 5 minutos
- `0 */2 * * *` - Cada 2 horas
- `0 0 * * *` - Diariamente a medianoche