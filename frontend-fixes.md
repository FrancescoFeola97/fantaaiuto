# Frontend Integration Fixes - FantaAiuto

## 🔍 Problemi Identificati

### 1. Endpoint Non Esistenti ❌
Il frontend sta cercando di accedere a endpoint che non esistono nel backend:
- `GET /api/leagues/{id}/members` - **NON ESISTE**
- Altri endpoint potrebbero essere mappati incorrettamente

### 2. Race Conditions ⏱️
Le chiamate API vengono fatte prima che `currentLeague` sia disponibile, causando richieste senza l'header `x-league-id` richiesto.

### 3. Endpoint ID Mismatch 🔄
I log mostrano tentativi di accesso a `/api/leagues/8/members` ma il backend usa league ID 10 per l'utente demo.

## ✅ Soluzioni Proposte

### Soluzione 1: Creare Endpoint Mancanti nel Backend
Aggiungere route per i membri della lega nel backend:

```javascript
// In backend/routes/leagues.js
router.get('/:leagueId/members', validateLeagueAccess, async (req, res, next) => {
  // Implementazione per ottenere membri della lega
});

router.post('/:leagueId/invite/username', validateLeagueAccess, async (req, res, next) => {
  // Implementazione per invitare utenti
});
```

### Soluzione 2: Aggiornare Frontend per Usare Endpoint Esistenti
Modificare il frontend per usare endpoint che già esistono:

```typescript
// Invece di /api/leagues/{id}/members
// Usare /api/leagues e filtrare lato client
```

### Soluzione 3: Migliorare Gestione League Context
Prevenire chiamate API quando `currentLeague` non è disponibile:

```typescript
// Aggiungere controlli più robusti
if (!currentLeague?.id) {
  setIsLoading(false);
  return;
}
```

## 🛠️ Fix Raccomandato

Creo gli endpoint mancanti nel backend per mantenere la compatibilità con il frontend esistente.