import { resolve, join } from "path";
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
import { makeFilemonger, helpers } from "../src";
import { readFileSync } from "fs";

const { f, writeFile } = helpers;

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

export const babelmonger: Filemonger = makeFilemonger(
  (srcDir$, destDir, opts) => {
    const observableBabelTransform = Observable.bindNodeCallback(transformFile);

    return srcDir$.delayWhen(srcDir =>
      observableBabelTransform(
        srcDir,
        opts || require(join(process.cwd(), ".babelrc"))
      )
        .map(({ code }) => code!)
        .flatMap(code =>
          writeFile(f.fullPath(f.abs(resolve(destDir, srcDir))), code)
        )
    );
  }
);
