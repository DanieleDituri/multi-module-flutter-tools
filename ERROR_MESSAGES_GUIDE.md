# Guida all'Implementazione di Messaggi di Errore e Successo

## Panoramica
Attualmente l'estensione manca di feedback chiaro all'utente quando i comandi completano o falliscono. Questo documento fornisce una strategia per aggiungere messaggi coerenti e informativi.

---

## 1. Messaggi di Errore Consigliati

### 1.1 Per `runShellCommand()`
**Problema attuale**: Gli errori vengono solo registrati nell'output channel, senza feedback visibile.

**Soluzione**: Aggiungere notifiche popup VSCode

```typescript
// Modificare extension.ts:64-69
child.on("error", (err) => {
  cancelDisposable?.dispose();
  output.appendLine(`❌ Error: ${err.message}`);
  vscode.window.showErrorMessage(`Command failed: ${err.message}`);
  resolve({ ok: false, error: err.message });
});

// Per exit code != 0
child.on("close", (code) => {
  cancelDisposable?.dispose();
  if (code !== 0) {
    const errorMsg = `Command exited with code ${code}`;
    output.appendLine(`❌ ${errorMsg}`);
    vscode.window.showErrorMessage(errorMsg);
  }
  resolve({ ok: code === 0, exitCode: code });
});
```

### 1.2 Per `getAllProjects()`
**Problema attuale**: Quando non ci sono progetti, mostra avviso generico.

**Messaggi suggeriti**:
```typescript
// Se nessun progetto trovato
vscode.window.showErrorMessage(
  "No Flutter modules found. Check your workspace configuration.",
  "Open Settings"
).then(selection => {
  if (selection === "Open Settings") {
    vscode.commands.executeCommand("workbench.action.openSettings", 
      "multiModuleFlutter");
  }
});
```

### 1.3 Per `convertDependenciesToLocal()`
**Problema attuale**: Silenzioso se il file pubspec.yaml non esiste.

**Messaggi suggeriti**:
```typescript
// Se file non trovato
output.appendLine(`⚠️ pubspec.yaml not found in ${projectPath}`);
vscode.window.showWarningMessage(
  `Cannot find pubspec.yaml in ${path.basename(projectPath)}`
);

// Se conversion fallisce
vscode.window.showErrorMessage(
  `Failed to convert dependencies for ${projectName}`
);
```

### 1.4 Per comandi Git
**Problema attuale**: Git errors non sono ben gestiti.

**Messaggi suggeriti**:
```typescript
// Per git operations
try {
  await git.raw(["stash", "pop", "--index", `stash@{${refMatch[1]}}`]);
  output.appendLine(`✅ Stash popped successfully`);
  vscode.window.showInformationMessage(`Stash restored`);
} catch (error: any) {
  output.appendLine(`❌ Failed to pop stash: ${error.message}`);
  vscode.window.showErrorMessage(
    `Failed to restore stash: ${error.message}`
  );
}
```

---

## 2. Messaggi di Successo Consigliati

### 2.1 Dopo `runProjectOperation()`
```typescript
// Al termine con successo
output.appendLine(`\n✅ Operation "${operationName}" completed successfully`);
vscode.window.showInformationMessage(
  `${operationName} completed on ${projectList.length} module(s)`
);
```

### 2.2 Dopo `runWorkspaceOperation()`
```typescript
// Al termine con successo
output.appendLine(`\n✅ Operation "${operationName}" completed successfully`);
vscode.window.showInformationMessage(
  `${operationName} completed on ${roots.length} workspace(s)`
);
```

### 2.3 Dopo conversione dipendenze
```typescript
// Se la conversione è riuscita
if (result) {
  output.appendLine(`✅ Dependencies converted to local paths`);
  vscode.window.showInformationMessage(
    `Successfully converted dependencies in ${projectName}`
  );
}
```

### 2.4 Dopo test runner
```typescript
// Se test lanciati con successo
vscode.window.showInformationMessage(
  `Test runner launched for ${projects.length} module(s)`,
  "Show Terminal"
).then(selection => {
  if (selection === "Show Terminal") {
    terminal.show();
  }
});
```

---

## 3. Pattern di Implementazione

### 3.1 Wrapper per Error Handling Coerente
Creare una funzione helper in `extension.ts`:

```typescript
enum CommandStatus {
  SUCCESS = "✅",
  ERROR = "❌",
  WARNING = "⚠️",
  INFO = "ℹ️",
}

interface CommandResult {
  ok: boolean;
  message: string;
  errorCode?: string;
}

function notifyCommand(
  status: CommandStatus,
  message: string,
  type: "error" | "warning" | "info" = "info"
): void {
  const fullMessage = `${status} ${message}`;
  output.appendLine(fullMessage);
  
  switch (type) {
    case "error":
      vscode.window.showErrorMessage(message);
      break;
    case "warning":
      vscode.window.showWarningMessage(message);
      break;
    case "info":
      vscode.window.showInformationMessage(message);
      break;
  }
}

// Utilizzo:
notifyCommand(CommandStatus.SUCCESS, "Operation completed", "info");
notifyCommand(CommandStatus.ERROR, "Failed to execute command", "error");
```

### 3.2 Enhanced `runShellCommand()` con callback
```typescript
function runShellCommand(
  command: string,
  cwd: string | undefined,
  output: vscode.OutputChannel,
  token?: vscode.CancellationToken,
  onSuccess?: (message: string) => void,
  onError?: (message: string) => void,
): Promise<{ ok: boolean; message?: string }> {
  const proxied = applyFvmProxy(command);
  output.appendLine(`$ ${proxied}`);

  return new Promise((resolve) => {
    const child = spawn("sh", ["-c", proxied], { cwd });

    child.on("close", (code) => {
      if (code === 0) {
        const message = `Command executed successfully (exit code: 0)`;
        output.appendLine(`✅ ${message}`);
        onSuccess?.(message);
        resolve({ ok: true, message });
      } else {
        const message = `Command failed with exit code ${code}`;
        output.appendLine(`❌ ${message}`);
        onError?.(message);
        resolve({ ok: false, message });
      }
    });

    child.on("error", (err) => {
      const message = `Execution error: ${err.message}`;
      output.appendLine(`❌ ${message}`);
      onError?.(message);
      resolve({ ok: false, message });
    });
  });
}
```

---

## 4. Messaggi Specifici per Comandi

### 4.1 Cache Repair
```
✅ Pub cache repaired successfully
❌ Failed to repair pub cache
```

### 4.2 Get Packages
```
✅ Packages fetched successfully on X module(s)
❌ Failed to fetch packages on X module(s)
```

### 4.3 Clean Build
```
✅ Build cleaned successfully
❌ Failed to clean build
```

### 4.4 Run
```
✅ App started successfully
❌ Failed to start app
```

### 4.5 Build Runner
```
✅ Build runner completed successfully
⚠️ Build runner completed with warnings
❌ Build runner failed
```

---

## 5. Cancellazione e Timeout

### 5.1 Quando operazione è cancellata
```typescript
if (token.isCancellationRequested) {
  output.appendLine(`⚠️ Operation cancelled by user`);
  vscode.window.showInformationMessage(`Operation cancelled`);
  break;
}
```

### 5.2 Timeout (consigliato da implementare)
```typescript
const COMMAND_TIMEOUT = 5 * 60 * 1000; // 5 minuti

setTimeout(() => {
  if (!completed) {
    child.kill();
    output.appendLine(`⚠️ Command timeout after 5 minutes`);
    vscode.window.showWarningMessage(
      `Command timed out after 5 minutes`
    );
  }
}, COMMAND_TIMEOUT);
```

---

## 6. Priorità di Implementazione

### P0 - Critical
1. ✅ Messaggi di errore in `runShellCommand()` con exit code
2. ✅ Messaggi di successo al completamento operazioni
3. ✅ Messaggi per comandi Git falliti

### P1 - Important
4. Wrapper helper `notifyCommand()` per coerenza
5. Messaggi di cancellazione
6. Enhanced error messages con dettagli

### P2 - Nice to Have
7. Timeout handling e messaggi
8. Retry logic con notifiche
9. Progress feedback durante operazioni

---

## 7. Checklist di Implementazione

- [ ] Aggiungere `notifyCommand()` helper function
- [ ] Modificare `runShellCommand()` per error/success messages
- [ ] Aggiungere successo message in `runProjectOperation()`
- [ ] Aggiungere successo message in `runWorkspaceOperation()`
- [ ] Migliorare error messages in `convertDependenciesToLocal()`
- [ ] Aggiungere error handling in `popNamedStash()`
- [ ] Testare tutti i messaggi in VSCode
- [ ] Documentare messaggi nel README
- [ ] Aggiungere emoji per visual clarity
- [ ] Considerare i18n per messaggi multilingue
