# 🔄 GitHub Integration Setup - Claude Code

## 🎯 Obiettivo
Permettere a Claude di fare automaticamente commit e push delle modifiche al tuo repository GitHub.

---

## 🔧 **Setup GitHub Actions (Metodo Raccomandato)**

### 1️⃣ **Installa Claude GitHub App**
- Vai su: https://github.com/apps/claude-for-github
- Clicca **"Install"**
- Seleziona repository: `FrancescoFeola97/fantaaiuto-v2`
- Autorizza l'accesso

### 2️⃣ **Aggiungi Secrets al Repository**
Su GitHub: `Settings → Secrets and variables → Actions → New repository secret`

**Aggiungi questi secrets:**
- `ANTHROPIC_API_KEY`: La tua chiave API Claude
- `NETLIFY_AUTH_TOKEN`: Token Netlify (opzionale per deploy auto)
- `NETLIFY_SITE_ID`: ID del tuo sito Netlify

### 3️⃣ **Files già configurati:**
- ✅ `.github/workflows/claude-code.yml` - Workflow automatico
- ✅ `CLAUDE.md` - Configurazione progetto per Claude
- ✅ File pronti per il commit

---

## 🔑 **Alternative: Personal Access Token**

### **Se preferisci controllo diretto:**

1. **GitHub → Settings → Developer settings → Personal access tokens**
2. **Generate new token (classic)**
3. **Seleziona scope**: `repo`, `workflow`, `write:packages`
4. **Copia token e condividilo con me in privato**

⚠️ **Sicurezza**: Il token ti darà accesso completo, usalo solo se ti fidi

---

## 🚀 **Come Funzionerà**

### **Con GitHub Actions:**
```
1. Tu chiedi modifiche a Claude
2. Claude fa le modifiche localmente  
3. Claude esegue: git add, commit, push
4. GitHub Actions builda automaticamente
5. Netlify deploya la nuova versione
6. Sito aggiornato in 2-3 minuti!
```

### **Comandi che Claude potrà usare:**
```bash
git add .
git commit -m "🔧 Feature XYZ implementata via Claude"
git push origin master
```

---

## 📋 **Prossimi Step**

1. **Fai il commit di questi nuovi file** (workflow e configurazione)
2. **Scegli il metodo** (GitHub Actions o Personal Token)
3. **Configura i secrets** se scegli GitHub Actions
4. **Testa con una piccola modifica**

---

## 🎊 **Risultato Finale**
Potrai dire: *"Claude, aggiungi questa feature e deployala online"* e tutto avverrà automaticamente! 🚀

Quale metodo preferisci? GitHub Actions (più sicuro) o Personal Token (più diretto)?