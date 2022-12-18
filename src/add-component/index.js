const prompts = require("prompts");
const { red, bold } = require("kolorist");
const { renderTemplate } = require("./utils");
const path = require("path");
const globby = require("globby");

module.exports = (api, options) => {
  let isCancel = false;
  const onCancel = function () {
    isCancel = true;
    return false;
  };
  api.registerCommand(
    "add",
    {
      description: "创建组件",
      usage: "vue-cli-service add",
    },
    () => {
      prompts(
        [
          {
            type: "select",
            name: "componentEnd",
            message: "组件在哪个端使用?",
            choices: [
              {
                title: "B端管理台",
                value: "B",
              },
              {
                title: "C端H5",
                value: "C",
              },
              {
                title: "PC端",
                value: "P",
              },
              {
                title: "小程序",
                value: "M",
              },
            ],
          },
          {
            type: "text",
            name: "componentName",
            message: "组件名:",
            validate: (input) => {
              const value = input && input.trim();
              if (!value) {
                return "组件名不能为空";
              }

              if (!/^[A-Z]/.test(value)) {
                return "组件名必须由大写字母开头";
              }

              if (!/^[a-z0-9A-Z]{3,}$/g.test(value)) {
                return "组件名必须由三个或者三个以上字母、数字组成";
              }
              return true;
            },
          },
          {
            type: (prev) => (prev === "Abc" ? "confirm" : null),
            message: "确定创建？",
          },
        ],
        {
          onCancel,
        }
      ).then((result) => {
        if (isCancel) {
          console.log(`${red(bold(`× 已取消`))}`);
          return;
        }
        const { componentEnd, componentName } = result;
        const name = `${componentEnd}${componentName}`;
        const componentClassName = Array.from(name).reduce((pre, cur) => {
          if (!pre) {
            return cur.toLowerCase();
          } else {
            if (cur >= "A" && cur <= "Z") {
              return `${pre}-${cur.toLowerCase()}`;
            } else {
              return pre + cur;
            }
          }
        }, "");
        console.log(`🚀 ${bold(`创建${name}组件...`)}`);

        const files = globby.sync(["**/*"], {
          cwd: path.resolve(__dirname, "template"),
          dot: true,
        });
        files.forEach((item) => {
          const src = path.resolve(__dirname, "template", item);
          const dest = path.resolve(
            api.getCwd(),
            item.replace("hello-world", componentClassName)
          );
          renderTemplate(src, dest, { name, componentClassName });
        });

        console.log(`👌 ${bold(`创建成功`)}`);
      });
    }
  );
};
