import { Observable, Operator, Subscriber, OperatorFunction } from "rxjs";
import { mergeMap } from "rxjs/operators";
import fs from "@filemonger/fs";

class PersistOperator implements Operator<string, string> {
  constructor(private _destPath: string) {}

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    return source
      .pipe(mergeMap(srcPath => fs.copy(srcPath, this._destPath)))
      .subscribe(subscriber);
  }
}

export default function persist(
  destPath: string
): OperatorFunction<string, string> {
  return (source: Observable<string>) =>
    source.lift(new PersistOperator(destPath));
}
