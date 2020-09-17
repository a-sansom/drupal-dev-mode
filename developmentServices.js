'use strict';

const fs = require('fs')
const YAML = require('yaml')

module.exports = function(DevModeEvents) {
  let dme = DevModeEvents

  /**
   * Toggle the twig.config debug settings in development.services.yml.
   * @param {string} filePath Path to development.services.yml file.
   */
  function toggleTwigDebugConfig(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        dme.emit('developmentServicesReadFailure', err)
        return
      }

      getDevelopmentServicesAsYaml(data, (err, dataAsYaml) => {
        if (err) {
          dme.emit('developmentServicesParseYamlFailure', err)
          return
        }

        const twigConfig = buildToggledTwigDebugConfig(dataAsYaml)
        dataAsYaml = mergeTwigConfigIntoDevelopmentServices(dataAsYaml, twigConfig)

        writeDevelopmentServicesYaml(filePath, dataAsYaml)
      })
    });
  }

  /**
   * Build object representing 'toggled' 'twig.config' settings.
   *
   * If there's no existing 'twig.config' settings, we create them, setting
   * things to true as the default. If they exist and are already true, we
   * change them to false, and if they exist already as false, we change them
   * to true.
   *
   * @param {object} dataAsYaml Development services data parsed to YAML
   * @return {object} Values for "toggled" 'twig.config' configuration
   */
  function buildToggledTwigDebugConfig(dataAsYaml) {
    let newTwigConfig = {}
    let oldTwigConfig = {
      debug: getYamlValueFromPath(dataAsYaml, ['parameters', 'twig.config', 'debug']),
      auto_reload: getYamlValueFromPath(dataAsYaml, ['parameters', 'twig.config', 'auto_reload'])
    }

    // If there were existing twig config values in the parsed YAML, and
    // those values were boolean, use them in the 'new values' template
    // we'll be using to toggle values in. Otherwise, we'll default the 'new
    // value' to 'true', as, as a best guess, we're yet to have configured
    // any twig debugging, so we'll be turning it on, in this run.
    Object.keys(oldTwigConfig).map((objectKey, index, array) => {
      let newConfigValue = true

      if (typeof oldTwigConfig[objectKey] === 'boolean') {
        newConfigValue = oldTwigConfig[objectKey]
      }

      newTwigConfig[objectKey] = newConfigValue
    })

    // If the existing twig config 'debug' value is boolean, then we want to
    // use it as a prompt to toggle all new twig config values to their
    // opposite (keeping the logic simple). If 'debug' isn't boolean, we'll
    // stay with the default values we previously calculated. This could be
    // improved, but: the complexity of the logic will get crazy.
    if (typeof oldTwigConfig['debug'] === 'boolean') {
      Object.keys(newTwigConfig).map((objectKey, index, array) => {
        newTwigConfig[objectKey] = (newTwigConfig[objectKey] === true) ? false : true
      })
    }

    return newTwigConfig
  }

  /**
   * Merge config with existing twig.config or create it, if required.
   *
   * @todo This could be better using 'nested-property' package functions to
   * check for existing/set property values. Is there an issue with this
   * currently if 'parameters' is null (which it isn't out of the box).
   * @todo This could be refactored to a more generic function like
   * 'mergeDataIntoDevelopmentServices()'. Passing in the existing data, new
   * data, and new data's 'parent' path.
   *
   * @param {object} dataAsYaml Development services data parsed to YAML
   * @param {object} twigConfig Values for 'twig.config' in development.services.yml
   */
  function mergeTwigConfigIntoDevelopmentServices(dataAsYaml, twigConfig) {
    if (getYamlValueFromPath(dataAsYaml, ['parameters', 'twig.config'])) {
      Object.assign(dataAsYaml['parameters']['twig.config'], twigConfig)
    }
    else {
      dataAsYaml['parameters']['twig.config'] = twigConfig
    }

    return dataAsYaml
  }

  /**
   * Get property value from object created by parsing YAML, given a property
   * path.
   * @param {object} yaml development.services.yml data parsed to an object.
   * @param {array} path Path to property to get value of, as an array of strings.
   * @return {*} Null if no value is found at given path, or the value for the path.
   */
  function getYamlValueFromPath(yaml, path) {
    let value = null

    if (Array.isArray(path)) {
      const reducer = (obj, key) => obj && obj[key]
      value = path.reduce(reducer, yaml)
    }

    return value
  }

  /**
   * Get development.services.yml data parsed as YAML.
   * @param {string} data Development services YAML settings, as a string.
   * @param {function} callback Function to call with string of data parsed to YAML.
   */
  function getDevelopmentServicesAsYaml(data, callback) {
    let err = null
    let dataAsYaml = {}

    try {
      dataAsYaml = YAML.parse(data)
    }
    catch (parseErr) {
      err = parseErr
    }

    callback(err, dataAsYaml)
  }

  /**
   * Write (updated) development services config (back) to file.
   * @param {string} filePath Path to development.services.yml file.
   * @param {Object} config Development services config as an object.
   */
  function writeDevelopmentServicesYaml(filePath, config) {
    // NOTE: Any comments in the original files are lost! This appears to be
    // widely accepted as what happens across all YAML parsers/packages?
    fs.writeFile(filePath, YAML.stringify(config), (err) => {
      if (err) {
        dme.emit('developmentServicesWriteFailure', err)
        return
      }

      dme.emit('developmentServicesWritten', filePath)
    });
  }

  return {
    buildToggledTwigDebugConfig: buildToggledTwigDebugConfig,
    mergeTwigConfigIntoDevelopmentServices: mergeTwigConfigIntoDevelopmentServices,
    getYamlValueFromPath: getYamlValueFromPath,
    getDevelopmentServicesAsYaml: getDevelopmentServicesAsYaml,
    toggleTwigDebugConfig: toggleTwigDebugConfig
  }
}
