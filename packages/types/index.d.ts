import { Observable } from "rxjs";
import { ConnectableObservable } from "rxjs";

type BindOperator = (
  fn: (unit: DirectoryStream<RelativePath>) => IFilemonger
) => IFilemonger;

type MulticastOperator = (
  ...sinkFactories: Array<
    (srcDir$: DirectoryStream<RelativePath>) => IFilemonger
  >
) => IFilemonger;

type Unit = (srcRoot: string, destDir: string) => DirectoryStream<RelativePath>;

type Run = (
  srcRoot: string,
  destDir: string,
  complete: (err: Error | undefined) => void
) => void;

export interface IFilemonger {
  bind: BindOperator;
  multicast: MulticastOperator;

  run: Run;
  unit: Unit;
}

export interface IDict<T> {
  [k: string]: T;
}

export type Filemonger<Opts extends IDict<any> = IDict<any>> = (
  pathOrDirStream?: string | Observable<string>,
  options?: Opts
) => IFilemonger;

export type Transform<Opts extends IDict<any>> = (
  srcDir$: DirectoryStream<RelativePath>,
  srcRoot: Directory<AbsolutePath>,
  destDir: Directory<AbsolutePath>,
  options: Opts
) => DirectoryStream<RelativePath>;

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
