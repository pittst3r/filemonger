const makeFilemonger = require("@filemonger/main");
const { filesInDir } = require("@filemonger/helpers");
const ts = require("typescript");
const { join } = require("path");

const typescriptmonger = makeFilemonger((file$, srcDir, destDir, opts) =>
  file$
    .map(file => join(srcDir, file))
    .toArray()
    .do(files => {
      const tsConfig = opts || require(join(process.cwd(), "tsconfig.json"));
      const baseOptions = tsConfig.compilerOptions;
      const compilerOptions = ts.convertCompilerOptionsFromJson(
        {
          ...baseOptions,
          rootDir: srcDir,
          outDir: destDir
        },
        process.cwd()
      ).options;
      const program = ts.createProgram(files, compilerOptions);
      const diagnostics = ts.getPreEmitDiagnostics(program);

      handleDiagnostics(diagnostics);
      program.emit();
    })
    .flatMapTo(filesInDir(destDir))
);

function handleDiagnostics(diagnostics) {
  diagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start
      );
      let message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      console.log(
        `${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`
      );
    }
  });

  if (diagnostics.length > 0) {
    throw new Error(
      `TypeScript compilation failed with ${diagnostics.length} error(s)`
    );
  }
}

module.exports = typescriptmonger;
