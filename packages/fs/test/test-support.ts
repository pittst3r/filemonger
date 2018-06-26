import { resolve } from "path";

export function fixturesPath(subDir: string = "") {
  return resolve(__dirname, "../../fixtures", subDir);
}
