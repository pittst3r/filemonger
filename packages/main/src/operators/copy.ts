import {
  Observable,
  Operator,
  Subscriber,
  OperatorFunction,
  bindNodeCallback
} from "rxjs";
import * as fse from "fs-extra";
import { mapTo, delayWhen } from "rxjs/operators";

export type ICopyOptions = fse.CopyOptions;

const observableCopy = bindNodeCallback<string, string, fse.CopyOptions, void>(
  fse.copy
);

class CopyOperator implements Operator<string, string> {
  constructor(private _destPath: string, private _options: ICopyOptions) {}

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    return source
      .pipe(
        delayWhen(srcPath =>
          observableCopy(srcPath, this._destPath, this._options)
        ),
        mapTo(this._destPath)
      )
      .subscribe(subscriber);
  }
}

export default function copy(
  destPath: string,
  options: ICopyOptions = {}
): OperatorFunction<string, string> {
  return (source: Observable<string>) =>
    source.lift(new CopyOperator(destPath, options));
}
