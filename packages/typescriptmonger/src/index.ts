import { makeFilemonger, helpers } from "@filemonger/main";
import { Filemonger } from "@filemonger/types";
import { join } from "path";
import {
  createProgram,
  getPreEmitDiagnostics,
  convertCompilerOptionsFromJson
} from "typescript";
import handleDiagnostics from "./handle-diagnostics";

const typescriptmonger: Filemonger = makeFilemonger(
  (file$, srcDir, destDir, opts) =>
    file$
      .map(file => join(srcDir, file))
      .toArray()
      .do(files => {
        const tsConfig = require(join(process.cwd(), "tsconfig.json")) || {};
        const baseOptions =
          opts.compilerOptions || tsConfig.compilerOptions || {};
        const compilerOptions = convertCompilerOptionsFromJson(
          {
            ...baseOptions,
            rootDir: srcDir,
            outDir: destDir
          },
          process.cwd()
        ).options;
        const program = createProgram(files, compilerOptions);
        const diagnostics = getPreEmitDiagnostics(program);

        handleDiagnostics(diagnostics);
        program.emit();
      })
      .flatMapTo(helpers.filesInDir(destDir))
);

export { typescriptmonger };
