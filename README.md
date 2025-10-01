# Starknet Cron Job - Vercel

Cron job serverless para ejecutar transacciones automáticas en Starknet, desplegado en Vercel.

## 🚀 Características

- Ejecución automática diaria a las **06:00 UTC**
- Serverless (Vercel Functions)
- Interacción con contratos Starknet
- Logging de transacciones
- Gratis en plan Hobby de Vercel

## 📋 Requisitos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en Starknet con fondos
- Repositorio en GitHub/GitLab/Bitbucket

## 🛠️ Instalación

1. **Clona el repositorio**
```bash
git clone <tu-repo>
cd jokers-of-neon-cron
```

2. **Instala dependencias**
```bash
npm install
```

## ⚙️ Configuración

### Variables de Entorno

Configura estas variables en el dashboard de Vercel:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PRIVATE_KEY` | Clave privada de tu cuenta Starknet | `0x123...` |
| `ADDRESS` | Dirección de tu cuenta Starknet | `0x456...` |
| `RPC_URL` | URL del RPC de Starknet | `https://starknet-mainnet.public.blastapi.io` |
| `CRON1_CONTRACT_ADDRESS` | Dirección del contrato a invocar | `0x789...` |

### Horario del Cron

El cron está configurado en [vercel.json](vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Schedule actual**: `0 6 * * *` = Todos los días a las 06:00 UTC

Para cambiar el horario, modifica la expresión cron. Ejemplos:
- `0 0 * * *` - Medianoche UTC
- `0 12 * * *` - Mediodía UTC
- `0 */6 * * *` - Cada 6 horas

Valida expresiones en [crontab.guru](https://crontab.guru)

## 🚀 Despliegue en Vercel

### Opción 1: Dashboard de Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **"Add New Project"**
3. Importa tu repositorio de Git
4. Vercel detectará automáticamente la configuración
5. Añade las variables de entorno en **"Environment Variables"**
6. Click en **"Deploy"**

### Opción 2: Vercel CLI

```bash
# Instala Vercel CLI
npm i -g vercel

# Login
vercel login

# Despliega
vercel --prod
```

Añade las variables de entorno:
```bash
vercel env add PRIVATE_KEY
vercel env add ADDRESS
vercel env add RPC_URL
vercel env add CRON1_CONTRACT_ADDRESS
```

## 📊 Monitoreo

- **Logs**: Ve a tu proyecto en Vercel → Functions → `/api/cron`
- **Transacciones**: Revisa [Starkscan](https://starkscan.co) con el hash devuelto
- **Errores**: Revisa los logs en el dashboard de Vercel

## 🧪 Testing Local

```bash
# Instala Vercel CLI
npm i -g vercel

# Crea archivo .env local
cp .env.example .env
# Edita .env con tus valores

# Inicia servidor local
vercel dev
```

Prueba el endpoint:
```bash
curl http://localhost:3000/api/cron \
  -H "user-agent: vercel-cron/1.0"
```

## 📁 Estructura del Proyecto

```
.
├── api/
│   └── cron.js          # Función serverless del cron job
├── vercel.json          # Configuración de Vercel y crons
├── package.json         # Dependencias
├── .env.example         # Ejemplo de variables de entorno
└── README.md            # Este archivo
```

## 🔒 Seguridad

- La función verifica que las peticiones vengan de Vercel (`user-agent: vercel-cron/1.0`)
- Las claves privadas se manejan como variables de entorno (nunca en el código)
- Solo el cron de Vercel puede invocar la función

## 📝 Notas

- **Límites del plan Hobby**: Máximo 2 cron jobs por cuenta, ejecución una vez al día
- **Duración**: Funciones limitadas a 10 segundos en Hobby (60s en Pro)
- **Precisión**: El cron puede ejecutarse entre 06:00 y 06:59 UTC (no exacto)
- **Invocaciones**: 100,000 gratis al mes en plan Hobby

## 🔧 Personalización

Para modificar la lógica del cron, edita [api/cron.js](api/cron.js):

```javascript
// Cambiar el entrypoint o calldata
const myCall = {
    contractAddress: contractAddress,
    entrypoint: 'tu_funcion',  // ← Cambia aquí
    calldata: [args]            // ← Y aquí
};
```

## 📚 Recursos

- [Documentación de Vercel Cron](https://vercel.com/docs/cron-jobs)
- [Starknet.js Docs](https://www.starknetjs.com/)
- [Starkscan Explorer](https://starkscan.co)
- [Crontab Guru](https://crontab.guru) - Validador de expresiones cron

## 🐛 Troubleshooting

### Error: "Acceso denegado"
La función solo acepta peticiones de Vercel Cron. Para testing local, usa `vercel dev`.

### Error: "Configuración incompleta"
Verifica que todas las variables de entorno estén configuradas en Vercel.

### Error: "Transaction failed"
Revisa que tu cuenta tenga fondos suficientes y que el contrato sea correcto.

## 📄 Licencia

MIT
