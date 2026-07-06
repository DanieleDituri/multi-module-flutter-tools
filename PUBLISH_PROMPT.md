# Prompt per Pubblicare una Nuova Versione

Usa questo prompt quando devi pubblicare una nuova versione dell'estensione su VS Code Marketplace e OpenVSX.

---

## Full Release Prompt

```
Pubblica la nuova versione dell'estensione Multi Module Flutter Tools:

1. Aumenta la versione in package.json di 0.1 (es: 1.3.0 → 1.4.0)
2. Crea il VSIX con: npm run package && npx vsce package --out multi-module-flutter-tools-X.X.X.vsix
3. Committa il change di versione con: git add package.json && git commit -m "chore: Bump version to X.X.X"
4. Pusha su git: git push origin main
5. Pubblica su VS Code Marketplace: vsce publish
6. Pubblica su OpenVSX: npx ovsx publish multi-module-flutter-tools-X.X.X.vsix
7. Crea un tag git: git tag -a vX.X.X -m "Release vX.X.X"
8. Pusha il tag: git push origin vX.X.X
9. Crea un GitHub Release con le release notes
10. Committa e pusha il RELEASE_PUBLISHED.md aggiornato

Assicurati che:
- ✅ Tutti i test passano (npm test)
- ✅ Compilation clean (npm run compile)
- ✅ Nessun warning o errore
- ✅ activationEvents è presente in package.json
```

---

## Step-by-Step Prompt (Se Vuoi Farlo per Passi)

### Passo 1: Preparation
```
Prepara la pubblicazione di una nuova versione:

1. Verifica che tutti i test passano: npm test
2. Verifica che la compilation è clean: npm run compile
3. Controlla che package.json ha "activationEvents": ["onStartupFinished"]
4. Leggi il version attuale da package.json
5. Aumenta la versione minor di 0.1 (es: 1.3.0 → 1.4.0)

Riporta:
- Current version: X.X.X
- New version: Y.Y.Y
- Test status: ✅/❌
- Compilation status: ✅/❌
```

### Passo 2: Version Bump & Build
```
Aumenta la versione e crea il VSIX:

1. Aggiorna package.json da versione X.X.X a Y.Y.Y
2. Esegui: npm run package
3. Esegui: npx vsce package --out multi-module-flutter-tools-Y.Y.Y.vsix
4. Verifica che il file VSIX è stato creato (ls -lh *.vsix | tail -1)
5. Committa: git add package.json && git commit -m "chore: Bump version to Y.Y.Y with [feature summary]"
6. Pusha: git push origin main

Riporta:
- ✅ package.json updated to Y.Y.Y
- ✅ VSIX created (size: XXX KB)
- ✅ Committed and pushed
```

### Passo 3: Publish to Marketplaces
```
Pubblica su entrambi i marketplace:

1. Pubblica su VS Code Marketplace: vsce publish
   (Se non autenticato: vsce login DanieleDituri prima)
2. Attendi che il marketplace elabori (~1 minuto)
3. Pubblica su OpenVSX: npx ovsx publish multi-module-flutter-tools-Y.Y.Y.vsix
   (Se richiede token: npx ovsx publish ... --pat YOUR_OPENVSX_TOKEN)
4. Verifica:
   - https://marketplace.visualstudio.com/items?itemName=DanieleDituri.multi-module-flutter-tools
   - https://open-vsx.org/extension/DanieleDituri/multi-module-flutter-tools

Riporta:
- ✅ Published to VS Code Marketplace (URL)
- ✅ Published to OpenVSX (URL)
- ✅ Both showing version Y.Y.Y
```

### Passo 4: GitHub Release
```
Crea il GitHub Release:

1. Crea il git tag: git tag -a vY.Y.Y -m "Release vY.Y.Y - [summary]"
2. Pusha il tag: git push origin vY.Y.Y
3. Crea il GitHub Release con:
   gh release create vY.Y.Y \
     --title "vY.Y.Y - [Feature Summary]" \
     --notes "[Release notes with: what's new, improvements, coverage stats]"
4. Verifica: https://github.com/DanieleDituri/multi-module-flutter-tools/releases/tag/vY.Y.Y

Riporta:
- ✅ Git tag created and pushed
- ✅ GitHub Release created (URL)
```

### Passo 5: Documentation
```
Aggiorna la documentazione:

1. Aggiorna RELEASE_PUBLISHED.md con:
   - New version number Y.Y.Y
   - Current date
   - Updated marketplace links
   - Key features/improvements summary
2. Committa: git add RELEASE_PUBLISHED.md && git commit -m "docs: Update release publication report for vY.Y.Y"
3. Pusha: git push origin main

Riporta:
- ✅ RELEASE_PUBLISHED.md updated
- ✅ Documentation committed and pushed
- ✅ Version Y.Y.Y now LIVE on all platforms
```

---

## Quick Checklist Before Publishing

- [ ] All tests passing: `npm test` → 56/56 ✅
- [ ] Compilation clean: `npm run compile` → No errors
- [ ] No TypeScript errors: `npm run check-types` → Pass
- [ ] No ESLint warnings: `npm run lint` → Pass
- [ ] activationEvents in package.json: `grep activationEvents package.json` → Found
- [ ] Package.json version updated to new version
- [ ] VSIX file created: `ls -lh *.vsix | tail -1` → File exists

---

## Post-Publication Verification

After publishing, verify:

1. **VS Code Marketplace**
   - Search for "Multi Module Flutter Tools"
   - Version shows Y.Y.Y
   - Install button works
   - URL: https://marketplace.visualstudio.com/items?itemName=DanieleDituri.multi-module-flutter-tools

2. **OpenVSX Registry**
   - Search for "Multi Module Flutter Tools"
   - Version shows Y.Y.Y
   - Install button works
   - URL: https://open-vsx.org/extension/DanieleDituri/multi-module-flutter-tools

3. **GitHub**
   - Release created: https://github.com/DanieleDituri/multi-module-flutter-tools/releases/tag/vY.Y.Y
   - Tag exists and is pushed
   - Main branch is synced

---

## If Something Goes Wrong

**VS Code Marketplace publish fails:**
- Check if authenticad: `vsce logout && vsce login DanieleDituri`
- Verify activationEvents in package.json
- Run `npm run package` again to rebuild

**OpenVSX publish fails:**
- Need token: `npx ovsx publish multi-module-flutter-tools-Y.Y.Y.vsix --pat YOUR_OPENVSX_TOKEN`
- Get token from: https://open-vsx.org/user/token

**Git push fails:**
- Verify you're on main: `git status`
- Pull latest: `git pull origin main`
- Push again: `git push origin main`

---

## Environment Setup (First Time)

If credentials aren't saved, set them up once:

**VS Code Marketplace:**
```bash
vsce login DanieleDituri
# Opens browser → authenticate with Microsoft account
# Saves token locally (~/.vsce)
```

**OpenVSX:**
1. Go to https://open-vsx.org/user/token
2. Generate a Personal Access Token
3. Save it somewhere secure (e.g., password manager)
4. Use with: `npx ovsx publish ... --pat YOUR_TOKEN`

**GitHub:**
```bash
# If using gh CLI
gh auth login
# Follow prompts to authenticate
```

---

## Example Usage

### For a minor feature release:
```
Pubblica v1.4.0 con le seguenti migliorie:
- Test coverage expanded to 65%
- Added new command for X
- Fixed bug Y

Segui i 5 passi:
1. Version bump e build
2. Verifica test e compilation
3. Committa versione
4. Pubblica su marketplace (vsce publish + ovsx publish)
5. Crea GitHub release con le release notes
```

### For a patch release:
```
Pubblica v1.3.1 con bug fix:
- Fixed crash in command X
- Improved error message for Y

Stessi 5 passi di prima, solo con versione patch (1.3.0 → 1.3.1)
```

---

## Notes

- La pubblicazione su entrambi i marketplace richiede ~1-2 minuti per essere elaborata
- I token sono salvati localmente sulla macchina (non nel repo)
- Ogni versione deve avere un tag git (per tracking)
- GitHub Release notes devono essere specifici e utili per gli utenti
- Sempre testare prima di pubblicare (npm test deve passare al 100%)
