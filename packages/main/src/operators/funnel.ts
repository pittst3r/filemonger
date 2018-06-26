import {
  Observable,
  Operator,
  Subscriber,
  OperatorFunction,
  of,
  forkJoin
} from "rxjs";
import { mergeMap, delayWhen } from "rxjs/operators";
import { tmp } from "../sources";
import { copy } from "../operators";

class FunnelOperator implements Operator<string, string> {
  constructor(private _ops: OperatorFunction<string, string>[]) {}

  call(subscriber: Subscriber<string>, srcDir$: Observable<string>) {
    return srcDir$
      .pipe(
        mergeMap(srcDir =>
          tmp().pipe(
            delayWhen(tmp =>
              forkJoin(this._ops.map(op => of(srcDir).pipe(op, copy(tmp))))
            )
          )
        )
      )
      .subscribe(subscriber);
  }
}

export default function funnel(
  ...ops: OperatorFunction<string, string>[]
): OperatorFunction<string, string> {
  return (source: Observable<string>) => source.lift(new FunnelOperator(ops));
}
