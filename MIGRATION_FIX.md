# ⚠️ SOLUCIÓN AL ERROR DE MIGRACIÓN 006

## El Problema

La migración 006 intentaba insertar usuarios en la tabla `users` pero los usuarios aún no existen en `auth.users`, causando un error de constraint.

## ✅ Solución Aplicada

He simplificado la migración 006 para que solo cree:
- ✅ 24 etiquetas esotéricas
- ✅ 7 quick replies

Los usuarios demo se crean **manualmente** después.

---

## 📋 PASOS CORREGIDOS PARA SUPABASE

### 1. Ejecutar Migraciones (EN ORDEN)

En Supabase → SQL Editor, ejecuta:

✅ `001_core_schema.sql` - Tablas y enums
✅ `002_helper_functions.sql` - Funciones helper
✅ `003_rls_policies.sql` - Políticas RLS
✅ `004_triggers.sql` - Triggers
✅ `005_indexes.sql` - Indexes
✅ `006_seed_data.sql` - **NUEVA VERSIÓN SIMPLIFICADA** ← Ejecuta esta ahora

### 2. Crear Usuarios en Authentication

1. Ve a **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Crea usuario Admin:
   - Email: `admin@crm-esoterico.com`
   - Password: `Admin123!` (o la que prefieras)
   - ✅ Confirm email automáticamente
4. Crea usuario Maestro:
   - Email: `maestro@crm-esoterico.com`
   - Password: `Maestro123!`

### 3. Asignar Roles a los Usuarios

En SQL Editor, ejecuta:

```sql
-- Asignar rol de admin
INSERT INTO users (id, email, full_name, role, is_active)
SELECT id, email, 'Administrador', 'admin'::role_type, true
FROM auth.users WHERE email = 'admin@crm-esoterico.com'
ON CONFLICT (email) DO UPDATE SET role = 'admin', is_active = true;

-- Asignar rol de maestro
INSERT INTO users (id, email, full_name, role, is_active)
SELECT id, email, 'Maestro Demo', 'maestro'::role_type, true
FROM auth.users WHERE email = 'maestro@crm-esoterico.com'
ON CONFLICT (email) DO UPDATE SET role = 'maestro', is_active = true;
```

### 4. Verificar

```sql
-- Ver usuarios creados
SELECT id, email, full_name, role, is_active FROM users;

-- Deberías ver 2 usuarios: admin y maestro
```

---

## ✅ Continúa con el Deployment

Ahora puedes continuar con:

1. ✅ Habilitar Realtime (conversations, messages)
2. ✅ Crear Storage buckets (media, avatars)
3. ✅ Desplegar Edge Functions
4. ✅ Configurar variables de entorno
5. ✅ Deploy a Vercel

Ver: `QUICK_START.md` o `DEPLOYMENT_GUIDE.md`
