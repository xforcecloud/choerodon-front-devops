process.env.NODE_ENV = 'development';
let env;
switch (process.env.NODE_ENV) {
  case ('development'):
    env = {
      'process.env.DEVOPS_HOST': JSON.stringify(process.env.DEVOPS_HOST || 'devops-service.staging.saas.hand-china.com'),
    };
    break;
  case ('production'):
    env = {
      'process.env.DEVOPS_HOST': JSON.stringify(process.env.DEVOPS_HOST || 'devops-service.staging.saas.hand-china.com'),
    };
    break;
  default:
    break;
}

const config = {
  port: 9090,
  output: './dist',
  htmlTemplate: 'index.template.html',
  devServerConfig: {},
  webpackConfig(configs) {
    const webpack = require('./devops/node_modules/webpack');
    configs.plugins.push(new webpack.DefinePlugin(env));
    return configs;
  },
  entryName: 'index',
  root: '/',
  routes: null, // by default, routes use main in package.json
  // server: 'http://api.staging.saas.hand-china.com', // api server e
  server: 'http://api.xcloud.xforceplus.com', // api server e
  // server: 'http://api.alpha.saas.hand-china.com',
  clientid: 'localhost',
  fileServer: 'http://minio.staging.saas.hand-china.com',
  titlename: 'XforceCloud', // html title
  favicon: 'favicon.ico', // page favicon
  theme: { // less/sass modify var
    //'primary-color': '#3f51b5',
     'primary-color': '#00896C',
    'icon-font-size-base': '16px',
  },
  dashboard: {
    devops: {
      components: 'src/app/devops/dashboard/*',
      locale: 'src/app/devops/locale/dashboard/*',
    },
  },
};

module.exports = config;
