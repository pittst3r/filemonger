import { inspectOutput } from "@filemonger/test-helpers";
import { resolve } from "path";
import { webpackmonger } from "../src";

const srcDir = resolve("fixtures");

describe("webpackmonger", function() {
  it("uses webpack.config.js", function() {
    const monger = webpackmonger(srcDir);

    return inspectOutput(monger, [
      {
        content:
          '!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:r})},n.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){"use strict";function r(){return"foo"}n.r(t),n.d(t,"default",function(){return r})}]);',
        file: "index.js"
      }
    ]);
  });

  it("ignores webpack.config.js if given options", function() {
    const monger = webpackmonger(srcDir, { entry: "./bar" });

    return inspectOutput(monger, [
      {
        content:
          '!function(e){var n={};function r(t){if(n[t])return n[t].exports;var o=n[t]={i:t,l:!1,exports:{}};return e[t].call(o.exports,o,o.exports,r),o.l=!0,o.exports}r.m=e,r.c=n,r.d=function(e,n,t){r.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:t})},r.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},r.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(n,"a",n),n},r.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},r.p="",r(r.s=0)}([function(e,n){console.log("bar")}]);',
        file: "main.js"
      }
    ]);
  });
});
