import Vue from 'vue'
    import './style.css'
    import 'highlight.js/styles/github.css';
    import md from 'D:\\xiaoe_project\\cli-plugins\\packages\\demo\\README.md'
    new Vue({
      render: h => h(md),
    }).$mount('#component-docs')
    