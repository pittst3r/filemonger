import * as ts from "typescript";
import { resolve, join, relative } from "path";
import { tmpdir } from "os";
import { mkdirpSync, outputFile } from "fs-extra";
import { Observable } from "rxjs";
import { transformFile } from "babel-core";
import { Directory, AbsolutePath, RelativePath, FullPath } from "../src/types";
import * as f from "../src/file";
import {
  TMP_NAMESPACE,
  copyFile,
  filesInDir,
  createTmpDir
} from "../src/helpers";
import makeFilemonger from "../src/index";
import { Subject } from "rxjs/Subject";
import { readFileSync } from "fs";

export function makeFileReader(
  dir: Directory<AbsolutePath>
): (
  filePath: FullPath<RelativePath>
) => { file: FullPath<RelativePath>; content: string } {
  return filePath => ({
    file: filePath,
    content: readFileSync(join(dir, filePath)).toString()
  });
}

export function fixturesPath(subDir: string = "") {
  return f.dir(
    f.abs(resolve(__dirname, "../../fixtures", f.dir(f.rel(subDir))))
  );
}

export function createTmpDirSync(): Directory<AbsolutePath> {
  const rand = Math.random()
    .toString(36)
    .substring(7);
  const path = f.dir(f.abs(join(tmpdir(), TMP_NAMESPACE, rand)));

  mkdirpSync(path);

  return path;
}

export const passthroughmonger = makeFilemonger((file$, { srcDir, destDir }) =>
  file$.flatMap(file =>
    copyFile(
      f.fullPath(f.abs(join(srcDir, file))),
      f.fullPath(f.abs(join(destDir, file)))
    ).map(file => f.fullPath(f.rel(relative(destDir, file))))
  )
);

export const babelmonger = makeFilemonger((file$, { srcDir, destDir }) => {
  const observableBabelTransform = Observable.bindNodeCallback(transformFile);

  return file$.flatMap(file =>
    observableBabelTransform(resolve(srcDir, file), {}).flatMap(
      ({ code }) =>
        new Observable(subscriber => {
          outputFile(resolve(destDir, file), code, err => {
            if (err) {
              subscriber.error(err);
              return;
            }

            subscriber.next(file);
            subscriber.complete();
          });
        })
    )
  );
});

export const typescriptmonger = makeFilemonger((file$, { srcDir, destDir }) =>
  file$
    .map(file => join(srcDir, file))
    .toArray()
    .do(files => {
      const baseOptions = require("../../tsconfig.json").compilerOptions;
      const compilerOptions = {
        ...baseOptions,
        rootDir: srcDir,
        outDir: destDir
      };
      const program = ts.createProgram(files, compilerOptions);
      const diagnostics = ts.getPreEmitDiagnostics(program);

      handleDiagnostics(diagnostics);
      program.emit();
    })
    .flatMapTo(filesInDir(destDir))
);

function handleDiagnostics(diagnostics: ts.Diagnostic[]) {
  diagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!
      );
      let message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      console.log(
        `${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`
      );
    }
  });

  if (diagnostics.length > 0) {
    throw new Error(
      `TypeScript compilation failed with ${diagnostics.length} error(s)`
    );
  }
}

export const typescriptbabelmonger = makeFilemonger(
  (file$, { srcDir, destDir }) =>
    createTmpDir().flatMap(tmpDir =>
      typescriptmonger(file$, srcDir, tmpDir).multicast(
        () => new Subject(),
        compiledTS$ =>
          Observable.merge(
            passthroughmonger(
              compiledTS$.filter(f => !!f.match(/d\.ts$/)),
              tmpDir,
              destDir
            ),
            babelmonger(
              compiledTS$.filter(f => !!f.match(/\.js$/)),
              tmpDir,
              destDir
            )
          )
      )
    )
);
