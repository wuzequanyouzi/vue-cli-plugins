const serveFunction = require('./serve');
const buildFunction = require('./build');
module.exports = (api, options) => {
  const { serve, build } = api.service.commands;

  serve.fn = serveFunction(api);
  build.fn = buildFunction(api);
};
