import { Observable } from "rxjs";
import { ConnectableObservable } from "rxjs";

export type Filemonger = (
  patternOrFileStream: string | FileStream<RelativePath>,
  srcDir: string,
  destDir: string
) => FileStream<RelativePath>;

export interface IPaths {
  srcDir: Directory<AbsolutePath>;
  destDir: Directory<AbsolutePath>;
}

export type Transform = (
  file$: FileStream<RelativePath>,
  paths: IPaths
) => FileStream<RelativePath>;

export type Extension = string & {
  __extensionBrand: any;
};

export type FileName = string &
  Extension & {
    __fileBrand: any;
  };

export type Path = string & {
  __pathBrand: any;
};

export type RelativePath = Path & {
  __relativePathBrand: any;
};

export type AbsolutePath = Path & {
  __absolutePathBrand: any;
};

export type Directory<P extends Path> = P & {
  __directoryBrand: any;
};

export type FullPath<P extends Path> = P & FileName;

export type Pattern = string & {
  __patternBrand: any;
};

export type FileStream<P extends Path> = Observable<FullPath<P>>;

export type DirectoryStream<P extends Path> = Observable<Directory<P>>;
