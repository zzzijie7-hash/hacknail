# Deploy

## Recommended split

- Frontend: Vercel
- Backend: Railway

## 1. Deploy backend on Railway

Project root already includes:

- `requirements.txt`
- `Procfile`
- `backend/hand_landmarker.task`

Set these environment variables in Railway:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` (optional, defaults to OpenAI)
- `FALLBACK_API_KEY`

Start command is read from `Procfile`:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

After deploy, copy the backend domain, for example:

```bash
https://your-backend-domain.railway.app
```

## 2. Deploy frontend on Vercel

Set this environment variable in Vercel:

```bash
VITE_API_BASE_URL=https://your-backend-domain.railway.app
```

Build settings:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

## 3. Mobile behavior

- Camera access requires HTTPS
- Result saving is best done via:
  - download
  - or system share sheet

## 4. Local dev

Frontend:

```bash
npm run dev
```

Backend:

```bash
uvicorn backend.main:app --reload --port 8000
```
