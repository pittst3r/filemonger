import { AbsolutePath, FullPath, VoidStream } from "@filemonger/types";
import { Observable } from "rxjs";
import { ensureLink } from "fs-extra";

export default function symlinkFile(
  srcFile: FullPath<AbsolutePath>,
  outFile: FullPath<AbsolutePath>
): VoidStream {
  return new Observable(subscriber => {
    ensureLink(srcFile, outFile, err => {
      if (err) {
        subscriber.error(err);
        return;
      }
      subscriber.next();
      subscriber.complete();
    });
  });
}
