import {
  FileStream,
  RelativePath,
  Directory,
  AbsolutePath
} from "@filemonger/types";
import { f, filesInDir } from "@filemonger/helpers";

export default function find(
  patternOrFileStream: string | FileStream<RelativePath>,
  srcDir: Directory<AbsolutePath>
): FileStream<RelativePath> {
  return typeof patternOrFileStream === "string"
    ? filesInDir(srcDir, f.pat(patternOrFileStream))
    : (patternOrFileStream as any);
}
