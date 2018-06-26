import { resolve, join } from "path";
import { mkdirpSync } from "fs-extra";
import { readFileSync } from "fs";

export function makeFileReader(
  dir: string
): (filePath: string) => { file: string; content: string } {
  return filePath => ({
    file: filePath,
    content: readFileSync(join(dir, filePath)).toString()
  });
}

export function fixturesPath(subDir: string = "") {
  return resolve(__dirname, "../../fixtures", subDir);
}

export function createTmpDirSync(): string {
  const rand = Math.random()
    .toString(36)
    .substring(7);
  const path = join(process.cwd(), "tmp", "filemonger", rand);

  mkdirpSync(path);

  return path;
}
