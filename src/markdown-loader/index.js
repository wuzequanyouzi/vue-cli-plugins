const { getOptions, getRemainingRequest } = require("loader-utils");
const { validate } = require("schema-utils");
const MarkdownIt = require("markdown-it");
const MarkdownItContainer = require("markdown-it-container");
const MarkdownItAnchor = require("markdown-it-anchor");
const MarkdownItTocDoneRight = require("markdown-it-toc-done-right");

const hljs = require("highlight.js");
const path = require("path");
const fs = require("fs");
const { switchCompName } = require("./util");

const schema = {
  type: "object",
  properties: {
    framework: {
      type: "string",
    },
    options: {
      type: "object",
    },
  },
};

const buildMdAnchorMap = {};

// 将文档的组件文件解析成code
const addCode = (path, markdownOption) => {
  const fileStr = fs.readFileSync(path).toString();
  const md = new MarkdownIt(markdownOption);
  return md.render(`
  \`\`\`html
  ${fileStr}
  \`\`\`
  `);
};

const enCodeStr = (path) => {
  const fileStr = fs.readFileSync(path).toString();
  return encodeURI(fileStr);
};

const NEW_LINE = "\r\n";
const DEFAULT_MARKDOWN_OPTIONS = {
  html: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre v-pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          "</code></pre>"
        );
      } catch (err) {
        // ignore
      }
    }
    return ""; // use external default escaping
  },
};

class MdParser {
  constructor({ source, options = {}, fileName }) {
    // 原文件信息
    this.source = source;

    this.fileName = fileName;

    // 参数合并
    this.options = Object.assign({ domId: "component-docs" }, options, {
      markdownOption: {
        ...DEFAULT_MARKDOWN_OPTIONS,
        ...options?.markdownOption,
      },
    });

    // 记录MD插槽文件路径
    this.filePaths = [];

    // 初始化MD解析器
    this.markdown = new MarkdownIt(this.options.markdownOption);
    // 初始化MD解析器插件
    MdParser.useMarkdownItContainer.apply(this);
    // 解析MD文档锚点
    MdParser.useMarkdownItAchor.apply(this);
  }

  // 解析MD
  parse() {
    // 定义结果对象，包括template，script，style三个部分
    let result =
      typeof this.options.process === "function"
        ? this.options.process(this.source)
        : {
            template: this.source,
          };

    const html = this.markdown.render(result.template);

    // 将packages组件注册为全局组件
    const globalUseComps = [[], []];
    const pwd = process.cwd();
    const compDirPath = path.resolve(pwd, "packages");
    if (fs.statSync(compDirPath).isDirectory) {
      const compDirs = fs.readdirSync(compDirPath);
      compDirs.forEach((item) => {
        const cuttentItem = path.resolve(compDirPath, item, "index.vue");
        if (fs.existsSync(cuttentItem)) {
          const componentName = switchCompName(item);
          globalUseComps[0].push(
            `import ${componentName} from '${cuttentItem.replace(
              /\\/g,
              "\\\\"
            )}';`
          );
          globalUseComps[1].push(
            `Vue.component('${componentName}', ${componentName});`
          );
        }
      });
    } else {
      throw new Error(`没找到${compDirPath}路径`);
    }

    // 默认解析MD之后需要动态生成的script
    const scriptStr = `
      <script>
        import Vue from 'vue';
        ${globalUseComps[0].join(" ")}
        ${globalUseComps[1].join(" ")}
        import CodePanel from '${path
          .resolve(__dirname, "./code-panel.vue")
          .replace(/\\/g, "\\\\")}';
        ${this.filePaths
          .map((item) => `import ${item.name} from '${item.path}'`)
          .join(";")}
        export default {
          components: {
            CodePanel,
            ${this.filePaths.map((item) => item.name).join(",")}
          }
        }
      </script>
    `;

    // 预留自定义处理函数
    if (typeof this.options.process === "function") {
      // 这里后续处理，目前双script不生效
      result.script = `<script>
        ${result.script || ""}
      </script>
      ${scriptStr}
      `;
      result.style = `<style>${
        result.style ||
        `
          pre {
            padding: 10px;
            background: #DDD;
          }
        `
      }</style>`;
    } else {
      result = {
        template: this.source,
        script: scriptStr,
        style: `<style>
          pre {
            padding: 10px;
            background: #DDD;
          }
        </style>`,
      };
    }

    // 判断使用的框架
    let vueFile = `
      <template>
        <div id="${this.options.domId || "component-docs"}" class="markdown-body">
          ${html}
        </div>
      </template>
      ${result.script}
    `;
    return vueFile;
  }
  static useMarkdownItContainer() {
    let { framework = "vue" } = this.options;
    framework = framework.toLocaleLowerCase();
    const that = this;
    this.markdown.use(MarkdownItContainer, framework, {
      validate(params) {
        return params.trim().match(/^vue\s+(.*)$/);
      },
      render(tokens, idx) {
        let str = tokens[idx].info.trim().match(/\s+(.*):::$/);
        if (tokens[idx].nesting === 1) {
          const pathTemp = str[1].trim();
          const filePath = path.resolve("./", pathTemp);
          if (!fs.existsSync(filePath)) {
            console.log("示例组件路径错误：", str[1]);
            return "\n";
          } else {
            const name = pathTemp.replace(/\//g, "_").split(".")[0];

            // 过滤重名组件，避免重复注册
            if (!that.filePaths.find((item) => item.name === name)) {
              that.filePaths.push({
                path: filePath.replace(/\\/g, "\\\\"),
                name: switchCompName(name),
              });
            }
            return `<CodePanel code="${enCodeStr(
              filePath
            )}"><${name}/> ${NEW_LINE}
                <template v-slot:code>
                  ${addCode(filePath, that.options.markdownOption)}
                </template> ${NEW_LINE}
                </CodePanel> ${NEW_LINE}
              `;
          }
        } else {
          return "";
        }
      },
    });
  }

  static useMarkdownItAchor() {
    const that = this;
    this.markdown.use(MarkdownItAnchor).use(MarkdownItTocDoneRight, {
      callback: function (html, ast) {
        buildMdAnchorMap[that.fileName] = ast;
        global.__buildMdAnchorMap__= buildMdAnchorMap;
      },
    });
  }
}
let a = 0;
module.exports = function (source) {
  const options = getOptions(this);
  // 获取解析md的目录路径（为了给md解析锚点设置唯一标识） 
  const mdFileDir = path.dirname(getRemainingRequest(this));
  let fileName = '';
  if (mdFileDir.includes('packages')) {
    // 是组件库组件
    fileName = path.basename(mdFileDir);
  } else {
    // 是组件库CHANGELOG
    fileName = 'project_changelog';
  }
  validate(schema, options, { name: "xiaoe-md-loader" });
  return new MdParser({
    source,
    options,
    fileName
  }).parse();
};
