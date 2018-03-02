import { Observable } from "rxjs";
import { ConnectableObservable } from "rxjs";

type BindOperator = (
  fn: (unit: Directory<AbsolutePath>) => IFilemonger
) => IFilemonger;

type WriteTo = (destDir: string) => OpaqueStream;

type Run = (
  destDir: string,
  complete: (err: Error | undefined) => void
) => void;

export interface IFilemonger {
  bind: BindOperator;

  run: Run;
  writeTo: WriteTo;
}

export interface IDict<T> {
  [k: string]: T;
}

export type Filemonger<Opts extends IDict<any> = IDict<any>> = (
  srcDir?: string,
  options?: Opts
) => IFilemonger;

export type Transform<Opts extends IDict<any>> = (
  srcDir: Directory<AbsolutePath>,
  destDir: Directory<AbsolutePath>,
  options: Opts
) => OpaqueStream | Promise<Opaque> | Opaque;

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

export type VoidStream = Observable<void>;

export type Opaque = object | null | undefined | void;

export type OpaqueStream = Observable<Opaque>;
