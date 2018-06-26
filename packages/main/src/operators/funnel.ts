import {
  Observable,
  Operator,
  Subscriber,
  OperatorFunction,
  of,
  merge
} from "rxjs";
import { mergeMap, delayWhen, last } from "rxjs/operators";
import fs from "@filemonger/fs";

class FunnelOperator implements Operator<string, string> {
  constructor(private _ops: OperatorFunction<string, string>[]) {}

  call(subscriber: Subscriber<string>, srcDir$: Observable<string>) {
    return srcDir$
      .pipe(mergeMap(srcDir => this._funnel(srcDir)))
      .subscribe(subscriber);
  }

  private _funnel(srcDir: string): Observable<string> {
    return merge(
      ...this._ops.map(op =>
        of(srcDir).pipe(op, delayWhen(srcDir => fs.copy(srcDir)))
      )
    ).pipe(last());
  }
}

export default function funnel(
  ...ops: OperatorFunction<string, string>[]
): OperatorFunction<string, string> {
  return (source: Observable<string>) => source.lift(new FunnelOperator(ops));
}
