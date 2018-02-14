# Filemonger

## Using a filemonger

```ts
import typescriptmonger from "some-cool-package";

typescriptmonger("**/*.ts", "./src", "./dist").subscribe({
  next(file) {
    console.log("Built file:", file);
  },
  complete() {
    console.log("Donezo");
  },
  error(err) {
    console.error(err);
  }
});
```

## Creating a filemonger

```ts
import { makeFilemonger, f, helpers: { copyFile } } from "filemonger";

export const passthroughmonger = makeFilemonger((file$, { srcDir, destDir }) =>
  file$.flatMap(file =>
      copyFile(
        f.fullPath(f.abs(join(srcDir, file))),
        f.fullPath(f.abs(join(destDir, file)))
      )
      .map(file => f.fullPath(f.rel(relative(destDir, file))))
  )
);
```
