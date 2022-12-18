const fs = require("fs");
const path = require("path");
module.exports.getModules = function (rootPath, examplesPath, entry) {
  const modules = [];
  fs.readdirSync(path.resolve(rootPath, examplesPath)).forEach((dir) => {
    const entryPath = path.resolve(rootPath, examplesPath, dir, entry);
    if (fs.existsSync(entryPath)) {
      modules.push({
        title: dir,
        value: entryPath,
        relativePath: path.join(examplesPath, dir, entry),
      });
    }
  });
  return modules;
};
