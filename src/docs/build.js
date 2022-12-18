/**
 * build.js
 * 改造cli-service build 指令
 * 调整webpack loader配置
 * 加载md-loader
 * 运行./template/main.js
 */

const prompts = require("prompts");
const { red, bold } = require("kolorist");
const path = require("path");
const fs = require("fs");
const {
  getModules,
  generateMainJs,
  deleteMainJs,
  buildMetaInfo,
  projectInfo,
  generateCompsPath,
  getChangelogCompPath
} = require("./utils");
const { META_FILE_PATH, DOCS_FILE_PATH, CHANGELOG_NAME } = require("./constant");
const execSync = require("child_process").execSync;

module.exports = (api) => {
  const { build } = api.service.commands;
  const buildCallBack = build.fn;
  return (...args) => {
    const { parent = "packages", entry = "README.md", mode } = args[0];
    if (mode === "docs") {
      // 核心流程，编译md
      const modules = getModules(api.getCwd(), parent, entry, "meta.json");
      if (!modules.length) {
        console.log(red(bold("没有可以执行打包的组件文档！")));
        process.exit();
      }
      console.log(`🚀 ${bold(`准备打包组件...`)}`);
      // 打包配置
      api.chainWebpack((config) => {
        config.entryPoints.clear();
        config.optimization.delete("splitChunks");
        config.module
          .rule("markdown")
          .test(/.md$/)
          .use("vue-loader")
          .loader("vue-loader")
          .end()
          .use("@xiaoe/markdown-loader")
          .loader("@xiaoe/markdown-loader")
          .options({
            framework: "vue",
            domId: 'component-docs'
          })
          .end();
      });
      console.log(`👌 ${bold(`加载配置成功`)}`);
      for (let index = 0; index < modules.length; index++) {
        const module = modules[index];
        const mainPath = generateMainJs(module.value.path, module.value.name);
        api.chainWebpack((config) => {
          config.entry(module.value.name).add(mainPath);
        });
      }

      // 编译CHANGELOG.md
      const changelogMdPath = path.resolve(api.getCwd(), 'CHANGELOG.md');
      if (fs.existsSync(changelogMdPath)) {
        const changelogMainPath = generateMainJs(changelogMdPath, CHANGELOG_NAME);
        api.chainWebpack((config) => {
          config.entry(CHANGELOG_NAME).add(changelogMainPath);
        });
      } else {
        console.log(`✖ ${bold(`CHANGELOG.md不存在`)}`);
      }

      const p = buildCallBack(...args);
      p.then(() => {
        const compsPathMap = generateCompsPath();
        let metaList = [];
        for (let index = 0; index < modules.length; index++) {
          const module = modules[index];
          if (module.value.name !== `${projectInfo.name}_changelog`) {  
            // 构建组件meta信息
            const { metaPath, name } = module.value;
            const metaFilePath = path.resolve(api.getCwd(), metaPath);
            const metaInfo = buildMetaInfo(
              name,
              metaFilePath,
              compsPathMap[name]
            );
            if (metaInfo) {
              metaList.push(metaInfo);
            }
          }
        }

        console.log(`☣️ ${bold(`最后操作A: 去掉不必要产物`)}`);
        for (let index = 0; index < modules.length; index++) {
          const module = modules[index];
          deleteMainJs(module.value.name);
        }

        // 生成组件元信息
        console.log(`🧬 ${bold(`最后操作B: 生成组件元信息`)}`);
        const outputDir = api.resolveWebpackConfig().output.path;
        /**
         * 请求文档目标meta.json =>  []
         * 对比当前所有组件meta信息，替换命中项
         * 回写meta.json到{{outputDir}}
         * 最终同步lib文件夹到目标机器 /data/wwwroot/master/jupiter/dist/components
         */
        const metaFilePath = path.resolve(META_FILE_PATH, "meta.json");
        let oldMetaInfo = [];
        if (fs.existsSync(metaFilePath)) {
          const metaFile = fs.readFileSync(metaFilePath);
          oldMetaInfo = JSON.parse(metaFile.toString());
        }
        const outputFilePath = path.resolve(outputDir, "meta.json");
        metaList.forEach((meta) => {
          const metaIndex = oldMetaInfo.findIndex(
            (oldMeta, index) => oldMeta.name === meta.name
          );
          if (metaIndex !== -1) {
            oldMetaInfo[metaIndex] = meta;
          } else {
            oldMetaInfo.push(meta);
          }
        });
        fs.writeFileSync(outputFilePath, JSON.stringify(oldMetaInfo), {
          encoding: "utf-8",
        });
        console.log(`🌌 ${bold(`组件元信息----OK----`)}`);

        // 生成项目元信息
        console.log(`🧬 ${bold(`最后操作C: 记录仓库信息`)}`);
        /**
         * 请求文档目标allProjectInfo.json =>  []
         * 更新allProjectInfo对应仓库信息
         * 回写allProjectInfo.json到{{outputDir}}
         * 最终同步lib文件夹到目标机器 /data/wwwroot/master/jupiter/dist/components
         */
        const allProjectFilePath = path.resolve(
          META_FILE_PATH,
          "projects.json"
        );
        let projects = [];
        if (fs.existsSync(allProjectFilePath)) {
          const allProjectFile = fs.readFileSync(allProjectFilePath);
          projects = JSON.parse(allProjectFile.toString());
        }
        const outputAllProjectFilePath = path.resolve(
          outputDir,
          "projects.json"
        );
        // 查找是否存在当前仓库信息
        const projectIndex = projects.findIndex(
          (project) => project.name === projectInfo.name
        );
        if (projectIndex === -1) {
          projects.push({
            name: projectInfo.name,
            version: projectInfo.version,
            components: metaList,
            changelog: getChangelogCompPath(),
            framework: projectInfo.framework,
            frameworkVersion: projectInfo.frameworkVersion,
            anchor: global.__buildMdAnchorMap__['project_changelog']
          });
        } else {
          let targetProject = projects[projectIndex] || {};
          // 这里需要处理多分支同时开发情况，让手动部署文档时，不覆盖文档
          // TODO： 有存在同个组件多个分支fix，同个时间段部署文档的可能，会导致覆盖（待解决，wzq）
          const storedComponentNameList = targetProject.components.map(item => item.name);
          metaList.forEach(componentMeta => {
            const storedCompIndex = storedComponentNameList.findIndex(item => componentMeta.name === item)
            // 存在就替换信息
            if (storedCompIndex !== -1) {
              targetProject.components[storedCompIndex] = componentMeta;
            } else {
              // 不存在直接新增信息
              targetProject.components.push(componentMeta)
            }
          })
          projects[projectIndex] = targetProject;
        }
        fs.writeFileSync(outputAllProjectFilePath, JSON.stringify(projects), {
          encoding: "utf-8",
        });
        console.log(`🌌 ${bold(`记录仓库信息----OK----`)}`);

        console.log(`🚠 ${bold("准备运送物资到目的地")}`);
        // 删除components
        const currentLibPath = path.resolve(outputDir, "../", "components");
        if (fs.existsSync(currentLibPath)) {
          execSync(
            `rm -rf ${currentLibPath}`,
            {
              encoding: "utf-8",
              stdio: "inherit",
            }
          );
        }
        // 路径 ./lib 改为 ./components
        fs.renameSync(outputDir, currentLibPath);

        // 转移编译之后从changelog组件到component-docs目录下
        const targetChangelogDirPath = path.resolve(
          DOCS_FILE_PATH
        );
        if (!fs.existsSync(targetChangelogDirPath)) {
          // 目标目录不存在，创建
          execSync(
            `mkdir -p ${targetChangelogDirPath}`
          );
        }
        const targetChangelogPath = path.resolve(
          targetChangelogDirPath,
          projectInfo.name
        );
        if (fs.existsSync(targetChangelogPath)) {
          // changelog文件夹存在，删除文件夹
          execSync(
            `rm -rf ${targetChangelogPath}`,
            {
              encoding: "utf-8",
              stdio: "inherit",
            }
          );
        }
        const originChangelogPath = path.resolve(currentLibPath, CHANGELOG_NAME);
        execSync(
          `cp -R ${originChangelogPath} ${targetChangelogPath}`,
          {
            encoding: "utf-8",
            stdio: "inherit",
          }
        );

        // 删除原产物的CHNAGELOG
        execSync(
          `rm -rf ${originChangelogPath}`,
          {
            encoding: "utf-8",
            stdio: "inherit",
          }
        )

        // 将./components 复制至目标位置
        execSync(
          `cp -R ${currentLibPath} ${path.resolve(META_FILE_PATH, "../")}`,
          {
            encoding: "utf-8",
            stdio: "inherit",
          }
        );
        console.log(`⚖️ ${bold(`Done`)}`);
      });
    } else {
      buildCallBack(...args);
    }
  };
};
