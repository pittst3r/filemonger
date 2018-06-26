import { resolve } from "path";
import { OperatorFunction, pipe, forkJoin, of, Observable } from "rxjs";
import { delayWhen, mapTo } from "rxjs/operators";
import { persist } from "./operators";

export * from "./operators";

export type Sinks = [string, OperatorFunction<string, string>][];

export abstract class Filemonger {
  rootDir = process.cwd();

  abstract srcDir: string;
  abstract destDir: string;
  abstract sinks: Sinks;

  get stream(): Observable<string> {
    return of(resolve(this.rootDir, this.srcDir)).pipe(
      delayWhen(this._run),
      mapTo(this.destDir)
    );
  }

  private get _run() {
    return (srcDir: string) =>
      forkJoin(this._ops.map(op => of(srcDir).pipe(op)));
  }

  private get _ops() {
    return this.sinks.map(([path, op]) =>
      pipe(op, persist(resolve(this.rootDir, this.destDir, path)))
    );
  }
}
