const inHtmlDir = f => !!f.match(/^static\/html/);
const inSrcDir = f => !!f.match(/^src/);
const inStylesDir = f => !!f.match(/^styles/);
const isHtml = f => !!f.match(/\.html$/);

module.exports = {
  inHtmlDir,
  inSrcDir,
  inStylesDir,
  isHtml
};
