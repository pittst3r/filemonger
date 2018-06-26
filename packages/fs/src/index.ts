import {
  Observable,
  from,
  combineLatest,
  of,
  bindNodeCallback,
  identity,
  OperatorFunction
} from "rxjs";
import * as rimraf from "rimraf";
import { join, resolve } from "path";
import * as fse from "fs-extra";
import { mapTo, mergeMap, map, toArray, tap } from "rxjs/operators";
import { lstat, readFile } from "fs-extra";
import * as glob from "glob";
import { createHash } from "crypto";

export type IFindOptions = glob.IOptions & { pattern?: string };
export type IHashObject = /* [type, path, hash] */ string[];

const observableGlob = (pattern: string, options: glob.IOptions) =>
  bindNodeCallback<string, glob.IOptions, string[]>(glob)(
    pattern,
    options
  ).pipe(mergeMap(identity));

const TMP_NAMESPACE = "filemonger";

export class FileSystem {
  rootDir: string;

  private _index: Map<string, string> = new Map();

  constructor(private _mountPoint: string) {
    const rootDir = join(
      this._mountPoint,
      TMP_NAMESPACE,
      process.pid.toString()
    );

    fse.mkdirpSync(rootDir);
    this.rootDir = rootDir;

    process.on("beforeExit", () => this.teardown());
  }

  find(
    cwd: string,
    { pattern, ...options }: IFindOptions = {}
  ): Observable<string> {
    return observableGlob(pattern || "**/*", { cwd, ...options });
  }

  has(path: string): boolean {
    return path.indexOf(this.rootDir) === 0;
  }

  memoize(
    srcPath: string,
    name: string,
    op: OperatorFunction<string, string>
  ): Observable<string> {
    const toOpHash = ([, , hash]: string[]) =>
      hashData(JSON.stringify(["op", name, hash]));
    const fetchDestDir = (opHash: string) =>
      this._index.has(opHash)
        ? of(this._index.get(opHash)!)
        : of(srcPath).pipe(
            op,
            tap(
              outPath => this.has(outPath) && this._index.set(opHash, outPath)
            )
          );

    return this.hashPath(srcPath).pipe(map(toOpHash), mergeMap(fetchDestDir));
  }

  hashPath(path: string): Observable<IHashObject> {
    return combineLatest(lstat(path), of(path)).pipe(
      map(([stats, path]) => [stats.isDirectory() ? "tree" : "blob", path]),
      mergeMap(
        ([type, path]) =>
          type === "tree"
            ? of(path).pipe(
                mergeMap(path =>
                  this.find(path, { pattern: "*", realpath: true })
                ),
                mergeMap(file => this.hashPath(file)),
                toArray(),
                map(tree => tree.sort((l, r) => (l[1] > r[1] ? 0 : -1))),
                map(tree => [type, path, hashData(JSON.stringify(tree))])
              )
            : from(readFile(path)).pipe(
                map(buffer => [type, path, hashData(buffer)])
              )
      )
    );
  }

  copy(srcPath: string, destPath?: string): Observable<string> {
    return destPath
      ? from(fse.copy(srcPath, destPath, { recursive: true })).pipe(
          mapTo(destPath)
        )
      : this.tmp().pipe(
          mergeMap(destPath =>
            from(fse.copy(srcPath, destPath, { recursive: true })).pipe(
              mapTo(destPath)
            )
          )
        );
  }

  symlink(srcPath: string, destPath: string): Observable<string> {
    return from(fse.ensureSymlink(srcPath, destPath)).pipe(mapTo(destPath));
  }

  tmp(): Observable<string> {
    const path = join(this.rootDir, this.rand());

    return from(fse.mkdirp(path)).pipe(mapTo(path));
  }

  write(data: string, destPath: string): Observable<string> {
    return from(fse.writeFile(destPath, data)).pipe(mapTo(destPath));
  }

  rand(): string {
    return Math.random()
      .toString(36)
      .substring(7);
  }

  clean(): void {
    this.teardown();
    this._index.clear();
  }

  teardown(): void {
    rimraf.sync(this.rootDir);
  }
}

function hashData(data: Buffer | string): string {
  const hash = createHash("sha1");

  hash.update(data);

  return hash.digest("hex");
}

const fs = new FileSystem(resolve("tmp"));

export default fs;
