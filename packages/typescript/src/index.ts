import { tmp } from "@filemonger/main";
import { IDict } from "@filemonger/types";
import { join } from "path";
import {
  createProgram,
  getPreEmitDiagnostics,
  convertCompilerOptionsFromJson
} from "typescript";
import handleDiagnostics from "./handle-diagnostics";
import {
  Observable,
  combineLatest,
  OperatorFunction,
  Operator,
  Subscriber
} from "rxjs";
import { map } from "rxjs/operators";

export interface IOpts {
  files?: string[];
  compilerOptions?: IDict<any>;
}

class TypescriptOperator implements Operator<string, string> {
  constructor(private _options: IOpts = Object.create({})) {}

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    return combineLatest(source, tmp())
      .pipe(
        map(([srcDir, destDir]) => {
          const files = this._options.files
            ? this._options.files.map(file => join(srcDir, file))
            : [];
          const tsConfig = require(join(process.cwd(), "tsconfig.json")) || {};
          const baseOptions =
            this._options.compilerOptions || tsConfig.compilerOptions || {};
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

          return destDir;
        })
      )
      .subscribe(subscriber);
  }
}

export function typescript(options?: IOpts): OperatorFunction<string, string> {
  return (source: Observable<string>) =>
    source.lift(new TypescriptOperator(options));
}
