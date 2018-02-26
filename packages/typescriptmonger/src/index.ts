import { makeFilemonger } from "@filemonger/main";
import { Filemonger, IDict } from "@filemonger/types";
import { join } from "path";
import {
  createProgram,
  getPreEmitDiagnostics,
  convertCompilerOptionsFromJson
} from "typescript";
import handleDiagnostics from "./handle-diagnostics";

export interface IOpts {
  entry: string;
  compilerOptions?: IDict<any>;
}

const typescriptmonger: Filemonger<IOpts> = makeFilemonger(
  (srcDir$, destDir, opts) =>
    srcDir$
      .do(srcDir => {
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
        const program = createProgram(
          [join(srcDir, opts.entry)],
          compilerOptions
        );
        const diagnostics = getPreEmitDiagnostics(program);

        handleDiagnostics(diagnostics);
        program.emit();
      })
      .mapTo(destDir)
);

export { typescriptmonger };
