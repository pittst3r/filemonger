import {
  FileStream,
  RelativePath,
  Directory,
  Path,
  Pattern
} from "@filemonger/types";
import { Observable } from "rxjs";
import glob = require("glob");
import { IOptions } from "glob";
import f = require("./file");

export default function filesInDir(
  dir: Directory<Path>,
  pattern: Pattern = f.pat("**/*.*")
): FileStream<RelativePath> {
  const obsGlob = Observable.bindNodeCallback<string, IOptions, string[]>(glob);

  return obsGlob(pattern, { cwd: dir }).flatMap(files => {
    return Observable.from(files).map(file => f.fullPath(f.rel(file)));
  });
}
