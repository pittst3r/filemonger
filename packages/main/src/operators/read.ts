import {
  Observable,
  Operator,
  Subscriber,
  OperatorFunction,
  bindNodeCallback
} from "rxjs";
import { mergeMap, map } from "rxjs/operators";
import { readFile } from "fs";

const observableRead = bindNodeCallback(readFile);

class ReadOperator implements Operator<string, string> {
  call(subscriber: Subscriber<string>, source: Observable<string>) {
    return source
      .pipe(
        mergeMap(filepath =>
          observableRead(filepath).pipe(map(buffer => buffer.toString()))
        )
      )
      .subscribe(subscriber);
  }
}

export default function read(): OperatorFunction<string, string> {
  return (source: Observable<string>) => source.lift(new ReadOperator());
}
