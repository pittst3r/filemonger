import {
  AbsolutePath,
  FullPath,
  VoidStream,
  Directory
} from "@filemonger/types";
import { Observable } from "rxjs";
import { ensureLink } from "fs-extra";

export default function symlinkFile(
  srcFile: FullPath<AbsolutePath> | Directory<AbsolutePath>,
  outFile: FullPath<AbsolutePath> | Directory<AbsolutePath>
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
