import { Operator, Subscriber, Observable, OperatorFunction } from "rxjs";
import { mergeMap } from "rxjs/operators";
import fs, { IFindOptions } from "@filemonger/fs";

class FindOperator implements Operator<string, string> {
  constructor(private _options: IFindOptions) {}

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    let { pattern, ...options } = this._options;

    return source
      .pipe(
        mergeMap(srcDir =>
          fs.find(pattern || "**/*", { cwd: srcDir, ...options })
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
