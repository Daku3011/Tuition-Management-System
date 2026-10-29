# Deployment, DevOps & Infrastructure Guide
## Production Deployment on Render, Vercel & Supabase

### 1. Architectural Distribution

- **Database & Storage**: Supabase (PostgreSQL 15+ with pg_stat_statements, connection pooler, and private storage buckets).
- **Backend API**: Render Web Service (FastAPI / Uvicorn ASGI Docker or Python native runtime).
- **Web Applications**: Vercel (Next.js 15 App Router Edge + Serverless).
- **Mobile Application**: Expo Application Services (EAS Build for Android APK/AAB and iOS IPA).

---

### 2. Supabase Configuration

1. **Create Project**:
   Create a new project in the Supabase Dashboard named `tuition-management-prod`.
2. **Obtain Connection Strings**:
   - Transaction Connection Pooler (Port 6543): Use for high-concurrency API instances on Render.
   - Session Connection Pooler (Port 5432): Use for Alembic migration commands.
3. **Storage Bucket**:
   Create a private storage bucket named `tuition-documents`. Set public access to `DISABLED`.
4. **Environment Variables**:
   Export `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

---

### 3. Render Backend Deployment

1. **Service Type**: Web Service (Docker).
2. **Root Directory**: `backend/`
3. **Build & Start Command**:
   - The included `Dockerfile` builds a lightweight Debian slim image running:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4
     ```
4. **Environment Variables on Render**:
   - `APP_ENV=production`
   - `APP_NAME="Apex Tuition Management System"`
   - `PORT=10000` (Render default or injected dynamically)
   - `DATABASE_URL=postgresql+psycopg2://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require`
   - `AUTH_SECRET_KEY=[32+ characters crypto random string]`
   - `CORS_ALLOWED_ORIGINS=https://tuition-management-web.vercel.app`
   - `SUPABASE_URL=https://[project-ref].supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY=[supabase-service-key]`
5. **Health Checks**:
   - Liveness path: `/health`
   - Readiness path: `/ready`

---

### 4. Vercel Web Deployment

1. **Root Directory**: `apps/web`
2. **Framework Preset**: Next.js
3. **Build Command**: `npm run build`
4. **Environment Variables on Vercel**:
   - `NEXT_PUBLIC_API_BASE_URL=https://[your-render-app-name].onrender.com/api/v1`
   - `NEXT_PUBLIC_APP_URL=https://tuition-management-web.vercel.app`
   - `NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=[supabase-anon-key]`

---

### 5. Expo Mobile Deployment (EAS)

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```
2. **Log In**:
   ```bash
   eas login
   ```
3. **Configure Project**:
   ```bash
   cd apps/mobile && eas build:configure
   ```
4. **Build Profiles (`eas.json`)**:
   - `development`: Debug client with simulator support.
   - `preview`: Internal distribution APK / TestFlight.
   - `production`: Google Play Store App Bundle (AAB) & iOS App Store distribution.
5. **Trigger Android Build**:
   ```bash
   eas build --platform android --profile preview
   ```
