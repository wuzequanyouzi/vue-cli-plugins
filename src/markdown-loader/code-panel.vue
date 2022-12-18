<template>
  <div class="panel-container">
    <div class="component-main">
      <slot>123</slot>
    </div>
    <div class="code-main">
      <div class="options">
        <i class="option-item" title="复制源代吗" @click="copyCode">
          <svg
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 24 24"
            width="1.2em"
            height="1.2em"
            data-v-65a7fb6c=""
          >
            <path
              fill="currentColor"
              d="M7 6V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3v3c0 .552-.45 1-1.007 1H4.007A1.001 1.001 0 0 1 3 21l.003-14c0-.552.45-1 1.007-1H7zM5.003 8L5 20h10V8H5.003zM9 6h8v10h2V4H9v2z"
            ></path></svg
        ></i>
        <i class="option-item" title="查看源代吗" @click="switchShowCodePanel">
          <svg
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 24 24"
            width="1.2em"
            height="1.2em"
            data-v-65a7fb6c=""
          >
            <path
              fill="currentColor"
              d="m23 12l-7.071 7.071l-1.414-1.414L20.172 12l-5.657-5.657l1.414-1.414L23 12zM3.828 12l5.657 5.657l-1.414 1.414L1 12l7.071-7.071l1.414 1.414L3.828 12z"
            ></path>
          </svg>
        </i>
      </div>
      <div
        ref="transBox"
        :class="{ 'transition-box': true, 'hide-box': isShowCodePanel }"
      >
        <slot name="code"></slot>
        <div class="code-button" @click="isShowCodePanel = false">
          <i style="width: 18px; height: 18px; margin-right: 8px"
            ><svg
              viewBox="0 0 1024 1024"
              xmlns="http://www.w3.org/2000/svg"
              data-v-65a7fb6c=""
            >
              <path
                fill="currentColor"
                d="M512 320 192 704h639.936z"
              ></path></svg
          ></i>
          收起源代码
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CodePanel",
  props: {
    code: {
      type: String,
      default: " ",
    },
  },
  data() {
    return {
      isShowCodePanel: false,
    };
  },
  methods: {
    copyCode() {
      const input = document.createElement("textarea");
      input.value = decodeURI(this.code);
      console.log(decodeURI(this.code));
      input.style.transform = "translateX(-1000px)";
      document.body.appendChild(input);
      input.select();
      document.execCommand("Copy");
      document.body.removeChild(input);
    },

    switchShowCodePanel() {
      this.isShowCodePanel = !this.isShowCodePanel;
      this.$refs.transBox.style.setProperty("--max-height", 0 + "px");
      this.$nextTick(() => {
        const height = this.$refs.transBox.scrollHeight;
        this.$refs.transBox.style.setProperty("--max-height", height + "px");
      });
    },
  },
};
</script>

<style scoped>
.panel-container .component-main {
  padding: 10px;
  border: 1px solid #ddd;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
.panel-container .code-main {
  padding: 10px;
  border: 1px solid #ddd;
  border-top: transparent;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  overflow: hidden;
}
.options {
  padding: 0 10px;
  text-align: right;
}
.options .option-item {
  cursor: pointer;
  margin: 0 4px;
}
.options .option-item:active {
  color: #409eff;
}
.transition-box {
  transform-origin: center top;
  transition: max-height 0.3s ease;
  will-change: max-height;
  overflow: hidden;
  max-height: 0;
}
.hide-box {
  max-height: var(--max-height);
}
.code-button {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  cursor: pointer;
  border-top: 1px solid #ddd;
}
.code-button:active {
  color: #409eff;
}
</style>
