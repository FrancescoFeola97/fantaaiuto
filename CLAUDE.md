# Claude Code Configuration

## Project Overview
FantaAiuto v2.0 - Advanced Fantasy Football Tracker for Italian Fantacalcio Mantra.

## Technology Stack
- **Frontend**: Vanilla JavaScript ES6+, HTML5, CSS3
- **Build**: Webpack 5
- **Styling**: Custom CSS with CSS Variables
- **Data**: localStorage persistence
- **Deploy**: Netlify
- **Desktop**: Electron (optional)

## Code Standards
- Use ES6+ features and modules
- Maintain event-driven architecture
- Follow existing naming conventions
- Keep Italian language in UI
- Preserve role-based color system
- Maintain localStorage compatibility

## Key Files
- `src/components/App.js` - Main application controller
- `src/components/tracker/Tracker.js` - Player list management
- `src/services/PlayerManager.js` - Player data operations
- `src/utils/Utils.js` - Utilities and role colors
- `index.html` - Main interface

## Build Commands
```bash
npm run build    # Production build
npm run dev      # Development server
npm run lint     # Code linting
```

## Deploy Process
- Auto-deploy on push to `master` branch
- Netlify builds from `dist/` directory
- Live site: https://statuesque-strudel-85da1f.netlify.app

## Development Workflow
1. Make changes locally
2. Test with `npm run dev`
3. Build with `npm run build`
4. Commit and push to trigger auto-deploy
5. Verify on live site

## Special Notes
- Role colors: W and T are purple/violet variants
- Main page organized by roles and tiers
- Excel import supports multiple modes
- Data persists via localStorage for multi-device usage
- Italian language interface required