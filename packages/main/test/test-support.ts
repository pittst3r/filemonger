import { resolve, join, relative } from "path";
import { mkdirpSync } from "fs-extra";
import { Observable } from "rxjs";
import { transformFile } from "babel-core";
import {
  Directory,
  AbsolutePath,
  RelativePath,
  FullPath,
  Filemonger
} from "@filemonger/types";
import { f } from "@filemonger/helpers";
import { symlinkFile, writeFile } from "@filemonger/helpers";
import { makeFilemonger } from "../src/index";
import { readFileSync } from "fs";

export function makeFileReader(
  dir: Directory<AbsolutePath>
): (
  filePath: FullPath<RelativePath>
) => { file: FullPath<RelativePath>; content: string } {
  return filePath => ({
    file: filePath,
    content: readFileSync(join(dir, filePath)).toString()
  });
}

export function fixturesPath(subDir: string = "") {
  return f.dir(
    f.abs(resolve(__dirname, "../../fixtures", f.dir(f.rel(subDir))))
  );
}

export function createTmpDirSync(): Directory<AbsolutePath> {
  const rand = Math.random()
    .toString(36)
    .substring(7);
  const path = f.dir(f.abs(join(process.cwd(), "tmp", "filemonger", rand)));

  mkdirpSync(path);

  return path;
}

export const passthroughmonger: Filemonger = makeFilemonger(
  (file$, srcDir, destDir) =>
    file$.delayWhen(file =>
      symlinkFile(
        f.fullPath(f.abs(join(srcDir, file))),
        f.fullPath(f.abs(join(destDir, file)))
      ).map(() => f.fullPath(f.rel(relative(destDir, file))))
    )
);

export const babelmonger: Filemonger = makeFilemonger(
  (file$, srcDir, destDir, opts) => {
    const observableBabelTransform = Observable.bindNodeCallback(transformFile);

    return file$.delayWhen(file =>
      observableBabelTransform(
        resolve(srcDir, file),
        opts || require(join(process.cwd(), ".babelrc"))
      )
        .map(({ code }) => code!)
        .flatMap(code =>
          writeFile(f.fullPath(f.abs(resolve(destDir, file))), code)
        )
    );
  }
);
