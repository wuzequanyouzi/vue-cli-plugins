const fs = require("fs");
const path = require("path");
const execSync = require("child_process").execSync;

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    execSync(`touch ${filePath}`);
  }
}

function deployDocs(
  name,
  cnname,
  docs = {
    readme: "README.md",
  },
  sourceDir,
  rootdir = `/data/wwwroot/master/jupiter/dist`,
  docsDir = "developer"
) {
  ensureDir(rootdir);
  //拷贝文件
  const docsPath = path.join(rootdir, docsDir, name);
  ensureDir(docsPath);

  const newMenu = {
    name,
    cnname,
  };
  Object.keys(docs).forEach((key) => {
    newMenu[key] = [`/${docsDir}`, name, docs[key]].join("/");
    fs.copyFileSync(
      path.join(sourceDir, docs[key]),
      path.join(docsPath, docs[key])
    );
  });

  //生成menus
  const menusPath = path.join(path.join(rootdir, docsDir), "menus.json");
  ensureFile(menusPath);
  const content = fs.readFileSync(menusPath).toString() || "[]";
  const menus = JSON.parse(content);

  const index = menus.findIndex((menu) => menu.name === name);
  if (index === -1) {
    menus.push(newMenu);
  } else {
    menus.splice(index, 1, newMenu);
  }
  fs.writeFileSync(menusPath, JSON.stringify(menus));
}

module.exports = deployDocs;
