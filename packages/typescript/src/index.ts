import fs from "@filemonger/fs";
import { IDict } from "@filemonger/types";
import { find } from "@filemonger/main";
import { join } from "path";
import {
  createProgram,
  getPreEmitDiagnostics,
  convertCompilerOptionsFromJson
} from "typescript";
import handleDiagnostics from "./handle-diagnostics";
import { Observable, OperatorFunction, Operator, Subscriber, of } from "rxjs";
import { map, toArray, mergeMap } from "rxjs/operators";

export interface IOpts {
  files?: string[];
  compilerOptions?: IDict<any>;
}

class TypescriptOperator implements Operator<string, string> {
  constructor(private _options: IOpts = Object.create({})) {}

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    return source
      .pipe(
        mergeMap(srcDir =>
          of(srcDir).pipe(
            find({ nodir: true, realpath: true }),
            toArray(),
            map(files => [srcDir, files])
          )
        ),
        mergeMap<[string, string[]], [string, string, string[]]>(
          ([srcDir, files]) =>
            fs.tmp().pipe(map(destDir => [srcDir, destDir, files]))
        ),
        map(([srcDir, destDir, files]) => {
          const tsConfig = require(join(process.cwd(), "tsconfig.json")) || {};
          const baseOptions =
            this._options.compilerOptions || tsConfig.compilerOptions || {};
          const compilerOptions = convertCompilerOptionsFromJson(
            {
              ...baseOptions,
              outDir: destDir
            },
            srcDir
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
