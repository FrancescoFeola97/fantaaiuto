# 🚀 Deploy Immediato Backend - Railway

Poiché sei già connesso a Railway con GitHub, segui questi passi:

## Metodo 1: Deploy Automatico da GitHub (Più Semplice)

### 1. Vai su Railway Dashboard
- Apri https://railway.app/dashboard
- Clicca "New Project"
- Seleziona "Deploy from GitHub repo"
- Scegli il repository `fantaaiuto`

### 2. Configurazione Deploy
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- Railway rileverà automaticamente che è un progetto Node.js

### 3. Variabili d'Ambiente (IMPORTANTE)
Nel dashboard Railway, vai in "Variables" e aggiungi:
```
NODE_ENV=production
JWT_SECRET=fantaaiuto-super-secure-jwt-secret-production-2024
FRONTEND_URL=https://fantaiuto.netlify.app
DATABASE_PATH=./database/fantaaiuto.db
```

### 4. Deploy Automatico
Railway farà automaticamente il deploy. Otterrai un URL tipo:
`https://fantaaiuto-backend-production.up.railway.app`

---

## Metodo 2: CLI (Se preferisci)

```bash
cd backend
railway login  # Aprirà browser per autorizzazione
railway init
railway up
```

---

## Dopo il Deploy

### 1. Testa Backend
Vai su: `https://TUO-URL-RAILWAY.up.railway.app/health`
Dovresti vedere: `{"status":"ok","timestamp":"...","version":"1.0.0"}`

### 2. Aggiorna Frontend
Dimmi l'URL del backend e aggiornerò automaticamente il frontend.

---

## 🎯 Prossimi Passi
1. **Tu**: Fai il deploy su Railway
2. **Io**: Aggiorno il frontend con il tuo URL backend
3. **Test**: Sistema completo funzionante!

Il deploy è GRATUITO e senza scadenza (Railway offre 500h/mese gratuite).