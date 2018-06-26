import { Observable, Operator, Subscriber, OperatorFunction } from "rxjs";
import { mergeMap } from "rxjs/operators";
import fs from "@filemonger/fs";

class MemoizeOperator implements Operator<string, string> {
  constructor(
    private _name: string,
    private _op: OperatorFunction<string, string>
  ) {}

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    return source
      .pipe(mergeMap(path => fs.memoize(path, this._name, this._op)))
      .subscribe(subscriber);
  }
}

export default function memoize(
  name: string,
  op: OperatorFunction<string, string>
): OperatorFunction<string, string> {
  return (source: Observable<string>) =>
    source.lift(new MemoizeOperator(name, op));
}
