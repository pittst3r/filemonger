import { make, helpers } from "@filemonger/main";
import { Filemonger } from "@filemonger/types";
import { join } from "path";
import { Observable } from "rxjs";

const { filesInDir, copyFile, file: { fullPath, abs, pat } } = helpers;

export interface IOpts {
  pattern?: string;
}

export const filtermonger: Filemonger<IOpts> = make(
  (srcDir, destDir, { pattern }) =>
    filesInDir(srcDir, pattern ? pat(pattern) : undefined)
      .delayWhen(file =>
        copyFile(
          fullPath(abs(join(srcDir, file))),
          fullPath(abs(join(destDir, file)))
        )
      )
      .concat(Observable.of(null))
      .last()
);
