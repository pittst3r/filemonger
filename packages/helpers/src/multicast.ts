import { FileStream, RelativePath } from "@filemonger/types";
import { Observable, Subject } from "rxjs";

export default function multicast(
  source$: FileStream<RelativePath>,
  ...sinkFactories: Array<
    (intermediate$: FileStream<RelativePath>) => FileStream<RelativePath>
  >
): FileStream<RelativePath> {
  return source$.multicast(
    () => new Subject(),
    intermediate$ =>
      Observable.merge(...sinkFactories.map(sF => sF(intermediate$)))
  );
}
