import * as ts from "typescript";
import { resolve, join, relative } from "path";
import { mkdirpSync } from "fs-extra";
import { Observable } from "rxjs";
import { transformFile } from "babel-core";
import {
  Directory,
  AbsolutePath,
  RelativePath,
  FullPath,
  Filemonger
} from "@filemonger/types";
import { f } from "@filemonger/helpers";
import { copyFile, filesInDir, writeFile } from "@filemonger/helpers";
import { makeFilemonger } from "../src/index";
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
  const path = f.dir(f.abs(join(process.cwd(), "tmp", "filemonger", rand)));

  mkdirpSync(path);

  return path;
}

export const passthroughmonger: Filemonger = makeFilemonger(
  (file$, srcDir, destDir) =>
    file$.delayWhen(file =>
      copyFile(
        f.fullPath(f.abs(join(srcDir, file))),
        f.fullPath(f.abs(join(destDir, file)))
      ).map(() => f.fullPath(f.rel(relative(destDir, file))))
    )
);

export const babelmonger: Filemonger = makeFilemonger(
  (file$, srcDir, destDir, opts) => {
    const observableBabelTransform = Observable.bindNodeCallback(transformFile);

    return file$.delayWhen(file =>
      observableBabelTransform(
        resolve(srcDir, file),
        opts || require(join(process.cwd(), ".babelrc"))
      )
        .map(({ code }) => code!)
        .flatMap(code =>
          writeFile(f.fullPath(f.abs(resolve(destDir, file))), code)
        )
    );
  }
);

export const typescriptmonger: Filemonger = makeFilemonger(
  (file$, srcDir, destDir, opts) =>
    file$
      .map(file => join(srcDir, file))
      .toArray()
      .do(files => {
        const tsConfig = {
          ...require(join(process.cwd(), "tsconfig.json")),
          ...opts
        };
        const baseOptions = tsConfig.compilerOptions;
        const compilerOptions = ts.convertCompilerOptionsFromJson(
          {
            ...baseOptions,
            rootDir: srcDir,
            outDir: destDir
          },
          process.cwd()
        ).options;
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

export const typescriptbabelmonger: Filemonger = makeFilemonger(
  (file$, srcDir, destDir, opts) =>
    typescriptmonger(file$, opts)
      .multicast(
        file$ => passthroughmonger(file$.filter(f => !!f.match(/d\.ts$/))),
        file$ => babelmonger(file$.filter(f => !!f.match(/\.js$/)))
      )
      .unit(srcDir, destDir)
);
