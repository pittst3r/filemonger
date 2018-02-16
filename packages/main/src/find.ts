import {
  FileStream,
  RelativePath,
  Directory,
  AbsolutePath
} from "@filemonger/types";
import { f, filesInDir } from "@filemonger/helpers";
import { Observable } from "rxjs";

export default function find(
  patternOrFileStream: string | Observable<string>,
  srcDir: Directory<AbsolutePath>
): FileStream<RelativePath> {
  return typeof patternOrFileStream === "string"
    ? filesInDir(srcDir, f.pat(patternOrFileStream))
    : (patternOrFileStream as any);
}
