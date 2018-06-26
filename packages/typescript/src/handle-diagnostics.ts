import { Diagnostic, flattenDiagnosticMessageText } from "typescript";

export default function handleDiagnostics(diagnostics: Diagnostic[]) {
  diagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!
      );
      let message = flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      console.log(
        `${flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`
      );
    }
  });

  if (diagnostics.length > 0) {
    throw new Error(
      `TypeScript compilation failed with ${diagnostics.length} error(s)`
    );
  }
}
