import { Observable } from "rxjs";
import { ConnectableObservable } from "rxjs";

export interface IFilemonger {
  bind(fn: (unit: FileStream<RelativePath>) => IFilemonger): IFilemonger;

  merge(other: IFilemonger): IFilemonger;

  multicast(
    ...sinkFactories: Array<(file$: FileStream<RelativePath>) => IFilemonger>
  ): IFilemonger;

  process(
    srcDir: string,
    destDir: string,
    complete: (
      err: Error | undefined,
      files: Array<FullPath<RelativePath>>
    ) => void
  ): void;

  return(srcDir: string, destDir: string): FileStream<RelativePath>;
}

export interface IDict<T> {
  [k: string]: T;
}

export type Filemonger<Opts extends IDict<any> = IDict<any>> = (
  patternOrFileStream: string | Observable<string>,
  options?: Opts | undefined
) => IFilemonger;

export interface IPaths {
  srcDir: Directory<AbsolutePath>;
  destDir: Directory<AbsolutePath>;
}

export type Transform<Opts extends IDict<any>> = (
  file$: FileStream<RelativePath>,
  srcDir: Directory<AbsolutePath>,
  destDir: Directory<AbsolutePath>,
  options?: Opts | undefined
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
