import { Filemonger, find } from "@filemonger/main";
import fs from "@filemonger/fs";
import { typescript } from "@filemonger/typescript";
import { of, pipe } from "rxjs";
import { map, mergeMap, delayWhen, withLatestFrom } from "rxjs/operators";
import ReactDOMServer from "react-dom/server";
import { join, parse } from "path";

const loadPages = srcDir =>
  of(srcDir).pipe(
    find({ pattern: "pages/**/*.js" }),
    map(page => [page, require(join(srcDir, page)).default])
  );

const renderPage = ([path, Page]) => {
  const parts = parse(path);
  const content = ReactDOMServer.renderToStaticMarkup(Page());

  return fs
    .tmp()
    .pipe(
      delayWhen(destDir =>
        fs.write(content, join(destDir, parts.dir, parts.name + ".html"))
      )
    );
};

export default class StaticReactSite extends Filemonger {
  srcDir = "src";
  destDir = "dist";
  sinks = [
    [".", pipe(typescript(), mergeMap(loadPages), mergeMap(renderPage))]
  ];
}
