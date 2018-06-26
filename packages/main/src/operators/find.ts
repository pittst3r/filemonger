import {
  Operator,
  Subscriber,
  Observable,
  OperatorFunction,
  bindNodeCallback,
  identity
} from "rxjs";
import { mergeMap } from "rxjs/operators";
import * as glob from "glob";

export type IFindOptions = glob.IOptions & { pattern?: string };

const observableGlob = (pattern: string, options: glob.IOptions) =>
  bindNodeCallback<string, glob.IOptions, string[]>(glob)(
    pattern,
    options
  ).pipe(mergeMap(identity));

class FindOperator implements Operator<string, string> {
  constructor(private _options: IFindOptions) {}

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    let { pattern, ...options } = this._options;

    return source
      .pipe(
        mergeMap(srcDir =>
          observableGlob(pattern || "**/*", { cwd: srcDir, ...options })
        )
      )
      .subscribe(subscriber);
  }
}

export default function find(
  options: IFindOptions = {}
): OperatorFunction<string, string> {
  return (source: Observable<string>) => source.lift(new FindOperator(options));
}
