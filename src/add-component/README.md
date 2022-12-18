## add-component
vue-cli-service插件，用于创建符合电商前端组件规范的Vue2组件文件。

### 使用前提
1. 工程中需安装@vue/cli-service
2. vue-cli的packageManager需默认npm，如下：
```json
//~.vuerc
{
  "packageManager": "npm",
}
```
### 如何使用
1. 安装插件
    ```shell
    vue add @xiaoe/add-component --registry http://111.230.199.61:6888
    ```
2. 新增script
    ```json
    "scripts": {
        "add": "vue-cli-service add"
    }
    ```
3. 运行`npm run add`命令
![效果图](https://talkcheap.xiaoeknow.com/ecommercefe/cli-plugins/-/raw/master/src/add-component/media/addcomponent.gif)