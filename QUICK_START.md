# 🚀 INICIO RÁPIDO - Deployment

## ✅ PASO 1: GIT Y GITHUB (COMPLETADO)

El repositorio local ya está inicializado y commiteado.

### Siguiente paso: Crear repositorio en GitHub

1. Ve a: https://github.com/new
2. Nombre del repositorio: `crm-esoterico`
3. **NO marques**: README, .gitignore, ni licencia
4. Click "Create repository"
5. Copia la URL que te da (ejemplo: `https://github.com/TU-USUARIO/crm-esoterico.git`)

### Luego ejecuta:

```bash
git remote add origin https://github.com/TU-USUARIO/crm-esoterico.git
git branch -M main
git push -u origin main
```

---

## 📋 PASO 2: SUPABASE

### 2.1 Crear Proyecto
1. Ve a: https://supabase.com
2. Click "New Project"
3. Completa:
   - Name: `crm-esoterico`
   - Database Password: **CREA UNA FUERTE Y GUÁRDALA**
   - Region: South America (o la más cercana)
4. Click "Create new project"
5. ⏳ Espera 2-3 minutos

### 2.2 Obtener Credenciales
Una vez creado:
1. Settings → API
2. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJ...` (key larga)
   - **service_role**: `eyJ...` (key larga - SECRETA)

### 2.3 Ejecutar Migraciones
1. Ve a SQL Editor
2. Click "New query"
3. Ejecuta cada archivo EN ORDEN:
   - `supabase/migrations/001_core_schema.sql`
   - `supabase/migrations/002_helper_functions.sql`
   - `supabase/migrations/003_rls_policies.sql`
   - `supabase/migrations/004_triggers.sql`
   - `supabase/migrations/005_indexes.sql`
   - `supabase/migrations/006_seed_data.sql`

### 2.4 Crear Usuarios
1. Authentication → Users → "Add user"
2. Crea:
   - `admin@crm-esoterico.com` / `Admin123!`
   - `maestro@crm-esoterico.com` / `Maestro123!`

3. En SQL Editor:
```sql
INSERT INTO users (id, email, full_name, role, is_active)
SELECT id, email, 'Administrador', 'admin', true
FROM auth.users WHERE email = 'admin@crm-esoterico.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

INSERT INTO users (id, email, full_name, role, is_active)
SELECT id, email, 'Maestro Demo', 'maestro', true
FROM auth.users WHERE email = 'maestro@crm-esoterico.com'
ON CONFLICT (id) DO UPDATE SET role = 'maestro';
```

### 2.5 Habilitar Realtime
1. Database → Replication
2. Habilita: `conversations` ✅
3. Habilita: `messages` ✅

### 2.6 Crear Storage
1. Storage → New bucket
2. Crea `media` (público ✅)
3. Crea `avatars` (público ✅)

---

## 📦 PASO 3: EDGE FUNCTIONS

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link (usa el Reference ID de Settings → General)
supabase link --project-ref TU-REFERENCE-ID

# Deploy todas las funciones
supabase functions deploy whatsapp-inbound
supabase functions deploy send-whatsapp
supabase functions deploy instagram-inbound
supabase functions deploy send-instagram
supabase functions deploy messenger-inbound
supabase functions deploy send-messenger
supabase functions deploy send-push-notification
```

---

## 🔑 PASO 4: VARIABLES DE ENTORNO

### En Supabase (Settings → Edge Functions → Secrets):
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
WHATSAPP_VERIFY_TOKEN=mi_token_123
IG_VERIFY_TOKEN=mi_token_456
FB_VERIFY_TOKEN=mi_token_789
```

### Crear .env.local:
```bash
New-Item -Path ".env.local" -ItemType File
```

Edita y agrega:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 PASO 5: PROBAR LOCALMENTE

```bash
npm run dev
```

Abre http://localhost:3000 y login con `admin@crm-esoterico.com`

---

## 🚀 PASO 6: VERCEL

```bash
# Instalar CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Configurar variables en Vercel Dashboard
# Luego deploy a producción:
vercel --prod
```

---

## 📱 PASO 7: META (OPCIONAL - Para webhooks reales)

Solo si quieres conectar WhatsApp/Instagram/Facebook reales.

Ver guía completa en: `DEPLOYMENT_GUIDE.md`

---

## ✅ CHECKLIST MÍNIMO

- [ ] GitHub repo creado y pusheado
- [ ] Supabase proyecto creado
- [ ] 6 migraciones ejecutadas
- [ ] Usuarios creados
- [ ] Realtime habilitado
- [ ] Storage buckets creados
- [ ] Edge Functions desplegadas
- [ ] .env.local creado
- [ ] Funciona en localhost
- [ ] Desplegado en Vercel

**Guía completa**: Ver `DEPLOYMENT_GUIDE.md` para todos los detalles.
