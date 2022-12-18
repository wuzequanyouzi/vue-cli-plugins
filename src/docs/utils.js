const fs = require("fs");
const path = require("path");
const { red, bold } = require("kolorist");

const { CHANGELOG_NAME } = require('./constant');

const DEV_FRAMES = ['vue'];
const DELETE_KEYS = ['private', 'scripts', 'devDependencies', 'eslintConfig'];

// 读取工程版本信息
let projectInfo = {};
const packagePath = path.resolve(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageFile = fs.readFileSync(packagePath);
  projectInfo = JSON.parse(packageFile.toString());
  const name = projectInfo.name.split('/').pop();
  projectInfo.name = name;
  const dependencies = Object.keys(projectInfo.dependencies);
  const findDevFrame = DEV_FRAMES.find(frame => dependencies.includes(frame));
  if (findDevFrame) {
    projectInfo.framework = `${findDevFrame}`;
    projectInfo.frameworkVersion = `${projectInfo.dependencies[findDevFrame]}`;
  } else {
    projectInfo.framework = '未知框架';
  }
} else {
  throw "工程不存在package.json";
}

module.exports.projectInfo = projectInfo;

// 读取模块信息
module.exports.getModules = function (rootPath, examplesPath, entry, meta = "meta.json") {
  const modules = [];
  fs.readdirSync(path.resolve(rootPath, examplesPath)).forEach((dir) => {
    const entryPath = path.resolve(rootPath, examplesPath, dir, entry);
    if (fs.existsSync(entryPath)) {
      modules.push({
        title: dir,
        value: {
          path: entryPath,
          relativePath: path.join(examplesPath, dir, entry),
          name: dir,
          metaPath: path.join(examplesPath, dir, meta)
        },
        relativePath: path.join(examplesPath, dir, entry),
      });
    } else {
      console.log(red(bold(`${dir}组件不存在README.md文件，已过滤`)))
    }
  });
  return modules;
};

const getMainTemplate = (domId) => {
    return `import Vue from 'vue'
    import './style.css'
    import 'highlight.js/styles/github.css';
    :::ikunFans*ikunFans=doubleIkun:::
    new Vue({
      render: h => h(md),
    }).$mount('${domId}')
    `
};

module.exports.reWriteMainJs = (mdPath, domId = '#component-docs') => {
    const mainPath = path.resolve(__dirname, 'template', 'main.js')
    mdPath = mdPath.replace(/\\/g, '\\\\');
    const mainTemplateStr = getMainTemplate(domId).replace(':::ikunFans*ikunFans=doubleIkun:::', `import md from '${mdPath}'`);
    fs.writeFileSync(mainPath, mainTemplateStr, {
        encoding: 'utf-8'
    });
    return mainPath;
}

module.exports.generateMainJs = (mdPath, name, domId = '#component-docs') => {
  const mainPath = path.resolve(__dirname, 'template', `${name}.js`)
  mdPath = mdPath.replace(/\\/g, '\\\\');
  const mainTemplateStr = getMainTemplate(domId).replace(':::ikunFans*ikunFans=doubleIkun:::', `import md from '${mdPath}'`);
  fs.writeFileSync(mainPath, mainTemplateStr, {
      encoding: 'utf-8'
  });
  return mainPath;
}

module.exports.deleteMainJs = (name) => {
  const mainPath = path.resolve(__dirname, 'template', `${name}.js`)
  if (fs.existsSync(mainPath)) {
    fs.unlinkSync(mainPath);
  }
}

module.exports.generateCompsPath = () => {
  const pathMap = {};
  // 读取组件所有产物名
  const dirs = fs.readdirSync('./lib');
  dirs.forEach(dir => {
    const _path = `./lib/${dir}`;
    if (fs.lstatSync(_path).isDirectory()) {
      pathMap[dir] = fs.readdirSync(_path).map(file => `components/${dir}/${file}`);
    };
  });
  return pathMap;
}

module.exports.getChangelogCompPath = () => {
  let changelogPath = null;
  // 读取现有组件
  const _path = `./lib/${CHANGELOG_NAME}`;
  if (fs.lstatSync(_path).isDirectory()) {
    changelogPath = fs.readdirSync(_path).map(file => `component-docs/${projectInfo.name}/${file}`);
  };
  return changelogPath;
}

module.exports.buildMetaInfo = (name, metaPath, compPath) => {
  if (fs.existsSync(metaPath)) {
    const metaFile = fs.readFileSync(metaPath);
    const metaInfo = JSON.parse(metaFile.toString());
    metaInfo.name = name;
    metaInfo.docs = compPath;

    // __buildMdAnchorMap__ 值从md-loader注入
    metaInfo.anchor = global.__buildMdAnchorMap__[name]

    // 判断业务框架
    // const dependencies = Object.keys(projectInfo.dependencies);
    // const findDevFrame = DEV_FRAMES.find(frame => dependencies.includes(frame));
    // if (findDevFrame) {
    //   metaInfo.framework = `${findDevFrame}${projectInfo.dependencies[findDevFrame]}`
    // } else {
    //   metaInfo.framework = '未知框架'
    // }
    // Object.keys(projectInfo).forEach(key => {
    //   if (DELETE_KEYS.includes(key)) {
    //     delete projectInfo[key]
    //   }
    // })
    // metaInfo.projectInfo = projectInfo;
    return metaInfo;
  }
  return null;
}
