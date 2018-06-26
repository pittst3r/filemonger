import { Observable, Operator, Subscriber, OperatorFunction, from } from "rxjs";
import { ensureSymlink } from "fs-extra";
import { mergeMap, mapTo } from "rxjs/operators";

class SymlinkOperator implements Operator<string, string> {
  constructor(private _destPath: string) {}

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    return source
      .pipe(
        mergeMap(srcPath =>
          from(ensureSymlink(srcPath, this._destPath)).pipe(
            mapTo(this._destPath)
          )
        )
      )
      .subscribe(subscriber);
  }
}

export default function link(
  destPath: string
): OperatorFunction<string, string> {
  return (source: Observable<string>) =>
    source.lift(new SymlinkOperator(destPath));
}
