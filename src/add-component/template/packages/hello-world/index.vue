<template>
  <div class="<%= componentClassName %>">
    {{ msg }}
  </div>
</template>

<script>
export default {
  name: "<%= name %>",
  data() {
    return {
      msg: "<%= name %>",
    };
  },
};
</script>

<style lang="scss" scoped>
.<%= componentClassName %> {
  font-size: 32px;
}
</style>
