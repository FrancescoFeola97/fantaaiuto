# 🚀 Guida Completa Deploy Backend FantaAiuto

## Opzione 1: Railway (Raccomandato - Gratuito)

### Passo 1: Preparazione
```bash
# Installa Railway CLI (già fatto)
npm install -g @railway/cli

# Vai nella cartella backend
cd backend
```

### Passo 2: Deploy su Railway
```bash
# Login a Railway (aprirà il browser)
railway login

# Inizializza progetto Railway
railway init

# Deploy del backend
railway up
```

### Passo 3: Configura Variabili d'Ambiente
Nel dashboard Railway (https://railway.app), vai al tuo progetto e aggiungi:
```
NODE_ENV=production
JWT_SECRET=fantaaiuto-super-secure-jwt-secret-production-2024
FRONTEND_URL=https://fantaiuto.netlify.app
DATABASE_PATH=./database/fantaaiuto.db
PORT=3001
```

### Passo 4: Ottieni URL Backend
Railway ti darà un URL tipo: `https://fantaaiuto-backend-production.up.railway.app`

---

## Opzione 2: Render (Alternativa Gratuita)

### Passo 1: Account Render
1. Vai su https://render.com
2. Registrati con GitHub
3. Collega il repository

### Passo 2: Crea Web Service
1. Click "New +" → "Web Service"
2. Seleziona il repository `fantaaiuto`
3. **Root Directory**: `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`

### Passo 3: Variabili d'Ambiente
Aggiungi nell'interfaccia Render:
```
NODE_ENV=production
JWT_SECRET=fantaaiuto-secure-jwt-secret
FRONTEND_URL=https://fantaiuto.netlify.app
```

---

## Opzione 3: Heroku (Gratuito con limiti)

### Passo 1: Heroku CLI
```bash
# Installa Heroku CLI
npm install -g heroku

# Login
heroku login
```

### Passo 2: Deploy
```bash
cd backend
heroku create fantaaiuto-backend
git subtree push --prefix=backend heroku main
```

### Passo 3: Configura Variabili
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secure-secret
heroku config:set FRONTEND_URL=https://fantaiuto.netlify.app
```

---

## Dopo il Deploy Backend

### 1. Aggiorna Frontend
Modifica `src/config/environment.js`:
```javascript
BACKEND_URL: process.env.NODE_ENV === 'production' 
  ? 'https://TUO-BACKEND-URL.herokuapp.com'  // Inserisci URL reale
  : 'http://localhost:3001'
```

### 2. Redeploy Frontend
```bash
npm run build
git add .
git commit -m "Update backend URL for production"
git push
```

### 3. Test Completo
1. Vai su https://fantaiuto.netlify.app/
2. Dovrai vedere un pulsante "🔐 Login"
3. Testa login con: `admin/password`
4. Verifica che tutti i dati si sincronizzino

---

## ✅ Vantaggi di Ogni Opzione

**Railway**: 
- ✅ Deploy più semplice
- ✅ 500h/mese gratuito
- ✅ Database SQLite supportato
- ✅ Scaling automatico

**Render**: 
- ✅ 750h/mese gratuito
- ✅ Deploy automatico da GitHub
- ✅ SSL automatico
- ✅ Monitoraggio incluso

**Heroku**: 
- ✅ Molto documentato
- ⚠️ 550h/mese gratuito
- ⚠️ Si iberna se inattivo

---

## 🎯 Raccomandazione

**Usa Railway** - è la soluzione più semplice e affidabile per questo progetto.