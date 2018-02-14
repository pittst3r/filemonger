import {
  FullPath,
  AbsolutePath,
  Directory,
  Pattern,
  Extension,
  FileName,
  Path,
  RelativePath
} from "@filemonger/types";

export function abs(str: string): AbsolutePath {
  return str as any;
}

export function dir<T extends Path>(str: T): Directory<T> {
  return str as any;
}

export function ext<T extends string>(str: T): T & Extension {
  return str as any;
}

export function fileName(str: string): FileName {
  return str as any;
}

export function fullPath<T extends Path>(str: T): FullPath<T> {
  return str as any;
}

export function pat(str: string): Pattern {
  return str as any;
}

export function path(str: string): Path {
  return str as any;
}

export function rel(str: string): RelativePath {
  return str as any;
}
