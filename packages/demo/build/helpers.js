const inAppDir = f => !!f.match(/^app/);
const inStylesDir = f => !!f.match(/^styles/);
const isHtml = f => !!f.match(/\.html$/);

module.exports = {
  inAppDir,
  inStylesDir,
  isHtml
};
