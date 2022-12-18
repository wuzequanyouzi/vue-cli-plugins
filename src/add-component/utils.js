const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const fse = require("fs-extra");

const isObject = (val) => val && typeof val === "object";
const mergeArrayWithDedupe = (a, b) => Array.from(new Set([...a, ...b]));

function deepMerge(target, obj) {
  for (const key of Object.keys(obj)) {
    const oldVal = target[key];
    const newVal = obj[key];

    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      target[key] = mergeArrayWithDedupe(oldVal, newVal);
    } else if (isObject(oldVal) && isObject(newVal)) {
      target[key] = deepMerge(oldVal, newVal);
    } else {
      target[key] = newVal;
    }
  }

  return target;
}
function sortDependencies(packageJson) {
  const sorted = {};

  const depTypes = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ];

  for (const depType of depTypes) {
    if (packageJson[depType]) {
      sorted[depType] = {};

      Object.keys(packageJson[depType])
        .sort()
        .forEach((name) => {
          sorted[depType][name] = packageJson[depType][name];
        });
    }
  }

  return {
    ...packageJson,
    ...sorted,
  };
}

//复制模板
function renderTemplate(src, dest, ejsData, ejsOptions) {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    // skip node_module
    if (path.basename(src) === "node_modules") {
      return;
    }

    // if it's a directory, render its subdirectories and files recursively
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      renderTemplate(path.resolve(src, file), path.resolve(dest, file));
    }
    return;
  }

  const filename = path.basename(src);

  if (filename === "package.json" && fs.existsSync(dest)) {
    // merge instead of overwriting
    const existing = JSON.parse(fs.readFileSync(dest, "utf8"));
    const newPackage = JSON.parse(fs.readFileSync(src, "utf8"));
    const pkg = sortDependencies(deepMerge(existing, newPackage));
    fs.writeFileSync(dest, JSON.stringify(pkg, null, 2) + "\n");
    return;
  }
  if (filename.startsWith("_")) {
    // rename `_file` to `.file`
    dest = path.resolve(path.dirname(dest), filename.replace(/^_/, "."));
  }

  fse.ensureFileSync(dest);
  //不支持对package.json和_开头的文件进行ejs渲染
  if (!ejsData || filename === "package.json" || filename.startsWith("_")) {
    fs.copyFileSync(src, dest);
  } else {
    const template = fs.readFileSync(src).toString();
    const content = ejs.render(template, ejsData, ejsOptions);
    fs.writeFileSync(dest, content);
  }
}
function preOrderDirectoryTraverse(dir, dirCallback, fileCallback) {
  for (const filename of fs.readdirSync(dir)) {
    if (filename === ".git") {
      continue;
    }
    const fullpath = path.resolve(dir, filename);
    if (fs.lstatSync(fullpath).isDirectory()) {
      dirCallback(fullpath);
      // in case the dirCallback removes the directory entirely
      if (fs.existsSync(fullpath)) {
        preOrderDirectoryTraverse(fullpath, dirCallback, fileCallback);
      }
      continue;
    }
    fileCallback(fullpath);
  }
}
function postOrderDirectoryTraverse(dir, dirCallback, fileCallback) {
  for (const filename of fs.readdirSync(dir)) {
    if (filename === ".git") {
      continue;
    }
    const fullpath = path.resolve(dir, filename);
    if (fs.lstatSync(fullpath).isDirectory()) {
      postOrderDirectoryTraverse(fullpath, dirCallback, fileCallback);
      dirCallback(fullpath);
      continue;
    }
    fileCallback(fullpath);
  }
}

module.exports = {
  deepMerge,
  sortDependencies,
  renderTemplate,
  preOrderDirectoryTraverse,
  postOrderDirectoryTraverse,
};
