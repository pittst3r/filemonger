import { resolve } from "path";
import {
  OperatorFunction,
  pipe,
  forkJoin,
  of,
  Observable,
  Subject
} from "rxjs";
import { symlink } from "./operators";
import { delayWhen, mapTo, take } from "rxjs/operators";

export * from "./operators";
export * from "./sources";

export type Sinks = [string, OperatorFunction<string, string>][];

export abstract class Filemonger {
  rootDir = process.cwd();

  abstract srcDir: string;
  abstract destDir: string;
  abstract sinks: Sinks;

  private _src = new Subject<string>();

  run(): Promise<string> {
    const single = this._stream.pipe(take(1)).toPromise();

    this._src.next(resolve(this.rootDir, this.srcDir));

    return single;
  }

  private get _stream(): Observable<string> {
    return this._src.pipe(delayWhen(this._run), mapTo(this.destDir));
  }

  private get _run() {
    return (srcDir: string) =>
      forkJoin(this._ops.map(op => of(srcDir).pipe(op)));
  }

  private get _ops() {
    return this.sinks.map(([path, op]) =>
      pipe(op, symlink(resolve(this.rootDir, this.destDir, path)))
    );
  }
}
