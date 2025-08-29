# 🚀 Guida Deploy GitHub + Netlify

## 📋 Passo 1: Creazione Repository GitHub

### 1️⃣ **Vai su GitHub.com**
- Accedi con: **FrancescoFeola97**
- Clicca **"New Repository"** (pulsante verde)

### 2️⃣ **Configura Repository**
- **Nome repository**: `fantaaiuto-v2`
- **Descrizione**: `🏆 FantaAiuto v2.0 - Advanced Fantasy Football Tracker`  
- **Visibilità**: ✅ Public (per Netlify gratuito)
- **NON** selezionare "Add a README file"
- Clicca **"Create repository"**

### 3️⃣ **Copia URL Repository**
GitHub ti darà un URL tipo: `https://github.com/FrancescoFeola97/fantaaiuto-v2.git`

---

## 📋 Passo 2: Push su GitHub

### 4️⃣ **Nel terminale, esegui:**

```bash
# Collega al repository GitHub
git remote add origin https://github.com/FrancescoFeola97/fantaaiuto-v2.git

# Push del codice
git push -u origin master
```

---

## 📋 Passo 3: Deploy Automatico Netlify

### 5️⃣ **Vai su netlify.com**
- Registrati/accedi
- Clicca **"New site from Git"**

### 6️⃣ **Collega GitHub**
- Seleziona **"GitHub"**  
- Autorizza Netlify
- Seleziona repository **"fantaaiuto-v2"**

### 7️⃣ **Configura Build** 
- **Branch to deploy**: `master`
- **Build command**: `npm run build` 
- **Publish directory**: `dist`
- Clicca **"Deploy site"**

---

## 🎯 Risultato Finale

### ✅ **Il tuo sito sarà live a:**
`https://peaceful-name-123456.netlify.app`

### ✅ **Vantaggi:**
- 🌐 **Accesso ovunque**: PC, tablet, mobile
- 💾 **Dati salvati**: localStorage per ogni device
- 🔄 **Deploy automatico**: ogni push = aggiornamento online
- 🔒 **HTTPS gratuito** e sicuro
- ⚡ **CDN mondiale** per velocità

### ✅ **Personalizzazione URL:**
- Su Netlify → Site settings → Change site name
- Puoi scegliere: `fantaaiuto-francesco.netlify.app`

---

## 🔧 Comandi Rapidi

```bash
# Modifiche future
git add .
git commit -m "🔧 Aggiornamento feature"  
git push

# Il sito si aggiornerà automaticamente in 1-2 minuti!
```

---

## ✅ **Stato Attuale:**
- ✅ Codice committato e pronto
- ⏳ Serve solo creare repository GitHub
- ⏳ Collegare a Netlify

**Tempo stimato: 5-10 minuti totali** ⏱️