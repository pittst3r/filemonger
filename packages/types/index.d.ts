import { Observable } from "rxjs";
import { ConnectableObservable } from "rxjs";

type BindOperator = (
  fn: (unit: FileStream<RelativePath>) => IFilemonger
) => IFilemonger;

type MergeOperator = (...others: IFilemonger[]) => IFilemonger;

type MulticastOperator = (
  ...sinkFactories: Array<(file$: FileStream<RelativePath>) => IFilemonger>
) => IFilemonger;

type Unit = (srcDir: string, destDir: string) => FileStream<RelativePath>;

type Run = (
  srcDir: string,
  destDir: string,
  complete: (
    err: Error | undefined,
    files: Array<FullPath<RelativePath>>
  ) => void
) => void;

export interface IFilemonger {
  bind: BindOperator;
  merge: MergeOperator;
  multicast: MulticastOperator;

  run: Run;
  unit: Unit;
}

export interface IDict<T> {
  [k: string]: T;
}

export type Filemonger<Opts extends IDict<any> = IDict<any>> = (
  patternOrFileStream?: string | Observable<string>,
  options?: Opts
) => IFilemonger;

export interface IPaths {
  srcDir: Directory<AbsolutePath>;
  destDir: Directory<AbsolutePath>;
}

export type Transform<Opts extends IDict<any>> = (
  file$: FileStream<RelativePath>,
  srcDir: Directory<AbsolutePath>,
  destDir: Directory<AbsolutePath>,
  options: Opts
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

export type VoidStream = Observable<void>;
