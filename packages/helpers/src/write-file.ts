import { FullPath, AbsolutePath, VoidStream } from "@filemonger/types";
import { Observable } from "rxjs";
import { outputFile } from "fs-extra";

export default function writeFile(
  destFile: FullPath<AbsolutePath>,
  content: string
): VoidStream {
  return new Observable(subscriber => {
    outputFile(destFile, content, err => {
      if (err) {
        subscriber.error(err);
        return;
      }

      subscriber.next();
      subscriber.complete();
    });
  });
}
