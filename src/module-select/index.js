const prompts = require("prompts");
const { red, green, bold } = require("kolorist");
const { getModules } = require("./utils");

module.exports = (api, options) => {
  const { serve } = api.service.commands;

  const serveFn = serve.fn;
  serve.fn = (...args) => {
    const { parent = "examples", entry = "index.js", mode } = args[0];
    //预览文档时，避免显示多个对话框
    if (mode === "docs") {
      return serveFn(...args);
    }
    const modules = getModules(api.getCwd(), parent, entry);
    if (modules.length === 0) {
      console.log(red(bold(`\n😢 ${parent}下没有组件\n`)));
      process.exit();
    }
    return prompts([
      {
        type: "select",
        name: "entry",
        message: "请选择你要调试的组件",
        initial: 0,
        choices: modules,
      },
    ]).then(({ entry }) => {
      const target = modules.find((item) => item.value === entry);
      console.log(
        green(
          bold(`\n🚀 启动调试\n   ${target.title}: ${target.relativePath}\n`)
        )
      );
      api.chainWebpack((config) => {
        config.entry("index").clear().add(entry);
      });
      return serveFn(...args);
    });
  };
};
