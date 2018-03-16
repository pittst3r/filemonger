import { IFilemonger } from "@filemonger/types";
import { mkdtempSync } from "fs";
import { join, resolve } from "path";
import * as glob from "glob";
import { readFileSync } from "fs";
import { assert } from "chai";
import * as rimraf from "rimraf";

function makeTmpDir() {
  return mkdtempSync(resolve("tmp", "filemonger-"));
}

export function inspectOutput(
  monger: IFilemonger,
  expected: { file: string; content: string }[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const destDir = makeTmpDir();

    monger.run(destDir, err => {
      if (err) reject(err);

      const actual = glob
        .sync("**/*.*", {
          cwd: destDir
        })
        .map(file => ({
          file,
          content: readFileSync(join(destDir, file)).toString()
        }));

      assert.sameDeepMembers(actual, expected);

      rimraf.sync(destDir);

      resolve();
    });
  });
}
