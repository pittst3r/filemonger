import { AbsolutePath, FullPath, VoidStream } from "@filemonger/types";
import { Observable } from "rxjs";
import { copy } from "fs-extra";

export default function copyFile(
  srcFile: FullPath<AbsolutePath>,
  outFile: FullPath<AbsolutePath>
): VoidStream {
  return new Observable(subscriber => {
    copy(srcFile, outFile, err => {
      if (err) {
        subscriber.error(err);
        return;
      }
      subscriber.next();
      subscriber.complete();
    });
  });
}
