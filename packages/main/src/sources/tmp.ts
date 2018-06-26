// import rimraf = require("rimraf");
import { join } from "path";
import { mkdirp } from "fs-extra";
import { Observable } from "rxjs";
import { tmpdir } from "os";

const TMP_NAMESPACE = "filemonger";

export default function tmp(): Observable<string> {
  return new Observable(subscriber => {
    const path = join(
      tmpdir(),
      TMP_NAMESPACE,
      Math.random()
        .toString(36)
        .substring(7)
    );

    mkdirp(path, err => {
      if (err) {
        subscriber.error(err);
        return;
      }

      subscriber.next(path);
      subscriber.complete();
    });
  });
}
