import {
  FileStream,
  RelativePath,
  Directory,
  AbsolutePath,
  DirectoryStream
} from "@filemonger/types";
import f = require("./file");
import rimraf = require("rimraf");
import { join } from "path";
import { mkdirp } from "fs-extra";
import { Observable } from "rxjs";

const TMP_NAMESPACE = "filemonger";

export default function tmp(
  fn: (tmpDir: Directory<AbsolutePath>) => FileStream<RelativePath>
): FileStream<RelativePath> {
  return createTmpDir().flatMap(tmpDir =>
    fn(tmpDir).do({
      complete() {
        rimraf(tmpDir, err => {
          if (err) throw err;
        });
      }
    })
  );
}

function createTmpDir(): DirectoryStream<AbsolutePath> {
  const path = f.dir(
    f.abs(
      join(
        process.cwd(),
        "tmp",
        TMP_NAMESPACE,
        Math.random()
          .toString(36)
          .substring(7)
      )
    )
  );

  return new Observable(subscriber => {
    mkdirp(path, err => {
      if (err) {
        subscriber.error(err);
        return;
      }

      subscriber.next(f.dir(f.abs(path)));
      subscriber.complete();
    });
  });
}
