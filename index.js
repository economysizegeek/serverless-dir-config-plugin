'use strict';
const _ = require('lodash');
const YAML = require('js-yaml');
const path = require("path");

const fs = require("fs");

function getAllFiles(file_path) {
  try {
    var files = fs.readdirSync(file_path);
    return (_.flatten(files.map(function (file) {
      if (fs.statSync(file_path + "/" + file).isDirectory()) {
        return (getAllFiles(file_path + "/" + file));
      }
      return (file_path + "/" + file);
    })));

  }
  catch (err) {
    return ([]);
  }
}
class DirConfig {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.appendConfig();

  }

  appendConfig() {
    const servicePath = this.serverless.config.servicePath;
    const func_path = servicePath + "/serverless/functions";
    const res_path = servicePath + "/serverless/resources";
    var serverless = this.serverless;

    var logger = this.log.bind(this);

    /*
     Serverless doesn't provide a hook for before the loading of the config file -
     BUT ---- plugins load first - so we can hook in and append to the config file.
     */

    var functions = getAllFiles(func_path);

    if (functions.length > 0) {
      logger("Adding functions from serverless/functions");
      functions.map(function (func) {
        var function_data = serverless.utils.readFileSync(func);
        logger("\t\t" + Object.keys(function_data).join(","));
        serverless.service.functions = _.merge(serverless.service.functions || {}, function_data);
      });
    }
    var resources = getAllFiles(res_path);
    if (resources.length > 0) {
      logger("Adding resources from serverless/resources");
      resources.map(function (res) {
        var resource_data = serverless.utils.readFileSync(res);
        var res_type = Object.keys(resource_data);
        logger("\t\t [" + res_type + "] " + Object.keys(resource_data[res_type]).join(","));
        serverless.service.resources = _.merge(serverless.service.resources || {}, resource_data);
      });
    }

    /*
     Serverless allows you to use variables for a lot of the settings.
     Serverless doesn't provide a hook for after the config file is loaded and resolved
     This wraps the function that resolves the config file
     Then it creating missing function names based on the configuration
     */

    serverless.variables.orig_populateService = serverless.variables.populateService;
    var wrapperFunc = function (cli_options) {

      var that = this;
      var config_result = serverless.variables.orig_populateService(cli_options);
      const stageNameForFunction = this.options.stage || this.service.provider.stage;
      _.forEach(that.service.functions, (functionObj, functionName) => {
        if (!functionObj.events) {
          that.service.functions[functionName].events = [];
        }
        if (!_.isArray(functionObj.events)) {
          throw new SError(`Events for "${functionName}" must be an array,` +
            ` not an ${typeof functionObj.events}`);
        }

        if (!functionObj.name) {
          that.service.functions[functionName].name =
            `${that.service.service}-${stageNameForFunction}-${functionName}`;
          //logger("Added in missing name for :" + functionObj.name);
        }

      });


      return (config_result);

    };
    this.serverless.variables.populateService = wrapperFunc;

  }

  getConfig() {
    return (this.serverless.service.custom.dirconfig || {});
  }

  log(msg) {
    if (!this.getConfig().quiet) {
      console.log(msg);
    }
  }
}


module.exports = DirConfig;
