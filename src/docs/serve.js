/**
 * serve.js
 * 改造cli-service serve 指令
 * 调整webpack loader配置
 * 加载md-loader
 * 运行./template/main.js
 */

const prompts = require("prompts");
const { red, bold } = require("kolorist");
const path = require("path");
const { getModules, reWriteMainJs } = require("./utils");
module.exports = (api) => {
	const { serve } = api.service.commands;
	const serveCallBack = serve.fn;
	return (...args) => {
		const { parent = "packages", entry = "README.md", mode, container = '#app' } = args[0];
		if (mode === "docs") {
			const modules = getModules(api.getCwd(), parent, entry);
			if (!modules.length) {
				console.log(
					`🚀 ${bold(`${red("未找到README.md")},请确保组件目录下存在README.md`)}`
				);
				process.exit();
			}
			return prompts([
				{
					type: "select",
					name: "selectComponentMd",
					message: "选择需要预览的组件",
					choices: modules,
				},
			]).then(({ selectComponentMd }) => {
				if (!selectComponentMd) {
					return;
				}
				console.log(`🚀 ${bold(`准备预览${selectComponentMd?.name}组件...`)}`);
				const mainPath = reWriteMainJs(selectComponentMd.path, container || '#app');
				api.chainWebpack((config) => {
					config.entry("index").clear().add(mainPath);
					delete config.entry.app;
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
						})
						.end();
				});
				
				console.log(`👌 ${bold(`加载配置成功`)}`);
				return serveCallBack(...args);
			});
		} else {
			serveCallBack(...args);
		}
	}
};
