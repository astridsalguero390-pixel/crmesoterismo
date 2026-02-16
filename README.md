# CRM Omnicanal Esotérico 🔮✨

CRM completo para negocios esotéricos con soporte para WhatsApp, Instagram DM y Facebook Messenger en una sola interfaz.

## 🌟 Características

- **Omnicanal**: WhatsApp Cloud API, Instagram Messaging, Facebook Messenger
- **Chat Center**: Interfaz tipo WhatsApp con mensajes en tiempo real
- **RBAC Estricto**: Admin (acceso total) y Maestros (solo conversaciones asignadas)
- **Pipeline**: nuevo → calificado → agendado → pago → seguimiento → perdido
- **Etiquetas**: 24 tags predefinidas para servicios esotéricos
- **Mensajería Rica**: Texto, imágenes, audio (grabación desde navegador)
- **Tiempo Real**: Supabase Realtime para actualizaciones instantáneas
- **PWA**: Instalable en móvil con push notifications
- **Admin Dashboard**: Métricas, gestión de maestros, etiquetas, reglas

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + RLS + Realtime + Storage + Edge Functions)
- **Deploy**: Vercel
- **APIs**: WhatsApp Cloud API, Instagram Messaging API, Facebook Messenger API

## 📋 Requisitos Previos

1. Cuenta de Supabase (https://supabase.com)
2. Cuenta de Meta Developer (https://developers.facebook.com)
3. Cuenta de Vercel (https://vercel.com)
4. Node.js 18+ y npm

## 🚀 Instalación

### 1. Clonar el repositorio

\`\`\`bash
git clone <repo-url>
cd crm-esoterico
npm install
\`\`\`

### 2. Configurar Supabase

#### 2.1 Crear proyecto en Supabase

1. Ve a https://supabase.com y crea un nuevo proyecto
2. Anota tu `Project URL` y `anon public key`

#### 2.2 Ejecutar migraciones

En el SQL Editor de Supabase, ejecuta en orden:

\`\`\`bash
# Desde el dashboard de Supabase > SQL Editor
# Ejecuta cada archivo en orden:
supabase/migrations/001_core_schema.sql
supabase/migrations/002_helper_functions.sql
supabase/migrations/003_rls_policies.sql
supabase/migrations/004_triggers.sql
supabase/migrations/005_indexes.sql
supabase/migrations/006_seed_data.sql
\`\`\`

#### 2.3 Habilitar Realtime

1. Ve a Database > Replication
2. Habilita Realtime para las tablas: `conversations`, `messages`

#### 2.4 Crear Storage Buckets

1. Ve a Storage
2. Crea bucket `media` (público)
3. Crea bucket `avatars` (público)

#### 2.5 Crear usuarios de prueba

En Authentication > Users, crea:

- `admin@crm-esoterico.com` (password: tu elección)
- `maestro@crm-esoterico.com` (password: tu elección)

Luego ejecuta en SQL Editor:

\`\`\`sql
-- Asignar roles
UPDATE users SET role = 'admin' WHERE email = 'admin@crm-esoterico.com';
UPDATE users SET role = 'maestro' WHERE email = 'maestro@crm-esoterico.com';
\`\`\`

#### 2.6 Desplegar Edge Functions

\`\`\`bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link proyecto
supabase link --project-ref <tu-project-ref>

# Deploy functions
supabase functions deploy whatsapp-inbound
supabase functions deploy send-whatsapp
supabase functions deploy instagram-inbound
supabase functions deploy send-instagram
supabase functions deploy messenger-inbound
supabase functions deploy send-messenger
supabase functions deploy send-push-notification
\`\`\`

### 3. Configurar Meta (Facebook/WhatsApp/Instagram)

#### 3.1 Crear App en Meta

1. Ve a https://developers.facebook.com
2. Crea una nueva app
3. Agrega productos: WhatsApp, Instagram, Messenger

#### 3.2 Configurar WhatsApp

1. En WhatsApp > Getting Started:
   - Anota `Phone Number ID`
   - Genera `Access Token`
2. En WhatsApp > Configuration:
   - Webhook URL: `https://<tu-proyecto>.supabase.co/functions/v1/whatsapp-inbound`
   - Verify Token: crea uno aleatorio (ej: `whatsapp_verify_123`)
   - Subscribe to: `messages`

#### 3.3 Configurar Instagram

1. En Instagram > Basic Display:
   - Conecta tu cuenta de Instagram Business
   - Anota `Instagram Account ID`
2. En Messenger > Webhooks:
   - Webhook URL: `https://<tu-proyecto>.supabase.co/functions/v1/instagram-inbound`
   - Verify Token: crea uno aleatorio
   - Subscribe to: `messages`

#### 3.4 Configurar Messenger

1. En Messenger > Settings:
   - Conecta tu Página de Facebook
   - Anota `Page ID`
   - Genera `Page Access Token`
2. En Webhooks:
   - Webhook URL: `https://<tu-proyecto>.supabase.co/functions/v1/messenger-inbound`
   - Verify Token: crea uno aleatorio
   - Subscribe to: `messages`

### 4. Generar VAPID Keys (Push Notifications)

\`\`\`bash
npx web-push generate-vapid-keys
\`\`\`

Anota las claves pública y privada.

### 5. Configurar Variables de Entorno

Crea `.env.local` basado en `.env.example`:

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_TOKEN=EAAxxxxx...
WHATSAPP_VERIFY_TOKEN=whatsapp_verify_123

# Instagram
IG_ACCOUNT_ID=123456789
IG_ACCESS_TOKEN=EAAxxxxx...
IG_VERIFY_TOKEN=ig_verify_456

# Messenger
FB_PAGE_ID=123456789
FB_PAGE_ACCESS_TOKEN=EAAxxxxx...
FB_VERIFY_TOKEN=fb_verify_789

# VAPID
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BHxxxxx...
VAPID_PRIVATE_KEY=xxxxx...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

También configura estas variables en Supabase > Settings > Edge Functions > Secrets.

### 6. Ejecutar en desarrollo

\`\`\`bash
npm run dev
\`\`\`

Abre http://localhost:3000

### 7. Desplegar en Vercel

\`\`\`bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Agregar variables de entorno en Vercel Dashboard
# Redeploy
vercel --prod
\`\`\`

## 📱 Uso

### Login

- Admin: `admin@crm-esoterico.com`
- Maestro: `maestro@crm-esoterico.com`

### Maestro

- Solo ve tab "Mis Chats"
- Solo ve conversaciones asignadas (owner_id)
- Puede responder mensajes
- Puede cambiar status_pipeline
- Puede agregar/quitar etiquetas
- Puede agregar notas internas
- NO puede reasignar conversaciones
- NO puede acceder a /admin

### Admin

- Ve tabs: "Mis Chats", "Sin Asignar", "Todos"
- Ve todas las conversaciones
- Puede asignar conversaciones a maestros
- Acceso completo a /admin/dashboard
- Puede gestionar maestros, etiquetas, reglas

## 🧪 Testing

### Probar WhatsApp

1. Envía un mensaje al número de WhatsApp configurado
2. Debe aparecer en "Sin Asignar" (si no hay reglas de asignación)
3. Admin puede asignar a un maestro
4. Maestro puede responder

### Probar RLS

1. Login como maestro
2. Intenta acceder a `/admin` → debe redirigir a `/chat`
3. Solo debe ver conversaciones asignadas
4. Intenta modificar `owner_id` via DevTools → debe fallar con error de trigger

### Probar Push Notifications

1. Abre la app en Chrome
2. Acepta permisos de notificaciones
3. Envía un mensaje a una conversación asignada
4. Debe aparecer notificación push (incluso con navegador minimizado)

## 📊 Estructura del Proyecto

\`\`\`
crm-esoterico/
├── app/
│   ├── layout.tsx          # Root layout con PWA metadata
│   ├── page.tsx            # Redirect a /chat
│   ├── login/page.tsx      # Página de login
│   ├── chat/page.tsx       # Chat Center
│   └── admin/
│       └── dashboard/page.tsx
├── components/
│   └── chat/
│       ├── ChatList.tsx    # Lista de conversaciones
│       ├── ChatPanel.tsx   # Panel de mensajes
│       └── MessageInput.tsx # Input con media upload
├── lib/
│   └── supabase/
│       ├── client.ts       # Browser client
│       ├── server.ts       # Server client
│       └── middleware.ts   # Auth middleware
├── supabase/
│   ├── migrations/         # SQL migrations
│   └── functions/          # Edge Functions
│       ├── whatsapp-inbound/
│       ├── send-whatsapp/
│       ├── instagram-inbound/
│       ├── send-instagram/
│       ├── messenger-inbound/
│       ├── send-messenger/
│       └── send-push-notification/
└── public/
    ├── manifest.json       # PWA manifest
    ├── sw.js              # Service Worker
    ├── icon-192.png
    └── icon-512.png
\`\`\`

## 🔒 Seguridad

- **RLS**: Todas las tablas tienen Row Level Security habilitado
- **Triggers**: `protect_conversation_fields` previene que maestros modifiquen campos protegidos
- **Middleware**: Valida autenticación y roles en cada request
- **Webhook Verification**: Todos los webhooks validan tokens de verificación
- **Service Role**: Solo Edge Functions usan service role key

## 🐛 Troubleshooting

### "supabaseKey is required"

- Verifica que `.env.local` tenga `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Reinicia el servidor de desarrollo

### Mensajes no aparecen en tiempo real

- Verifica que Realtime esté habilitado en Supabase para `conversations` y `messages`
- Revisa la consola del navegador para errores de suscripción

### Push notifications no funcionan

- Solo funcionan en HTTPS (producción) o localhost
- iOS Safari tiene limitaciones cuando la app está cerrada
- Verifica que VAPID keys estén configuradas correctamente

### Webhook no recibe mensajes

- Verifica que la URL del webhook sea correcta y accesible públicamente
- Verifica que el verify token coincida
- Revisa logs en Supabase > Edge Functions > Logs

## 📝 Licencia

MIT

## 🤝 Contribuciones

Pull requests son bienvenidos. Para cambios mayores, abre un issue primero.

## 📧 Soporte

Para soporte, contacta a [tu-email@example.com]
