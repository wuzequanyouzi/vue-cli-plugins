<template>
  <div id="app">
    <<%= name %>></<%= name %>>
  </div>
</template>

<script>
import <%= name %> from "../../packages/<%= componentClassName %>/index.vue";
export default {
  components: { <%= name %> },
};
</script>

<style lang="scss" scoped>
#app {
  //todo
}
</style>
