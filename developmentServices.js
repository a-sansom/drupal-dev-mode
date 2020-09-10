'use strict';

const fs = require('fs')
const YAML = require('yaml')

/**
 * Toggle the twig.config debug settings in development.services.yml.
 * @param {string} filePath Path to development.services.yml file.
 */
function toggleTwigDebugConfig(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log(err)
      return
    }

    getDevelopmentServicesAsYaml(data, (err, dataAsYaml) => {
      if (err) {
        console.log(err)
        return
      }

      const currentDebug = getYamlValueFromPath(dataAsYaml, ['parameters', 'twig.config', 'debug'])
      const currentAutoReload = getYamlValueFromPath(dataAsYaml, ['parameters', 'twig.config', 'auto_reload'])

      // If there were already values, and those values were boolean, use them in
      // the template we'll be toggling values in. Otherwise, we'll default to
      // 'true' values, as, as a guess we're yet to have configured any twig
      // debugging, so we'll be turning it on, in this pass.
      let twigConfigTemplate = {
        debug: (typeof currentDebug === 'boolean') ? currentDebug : true,
        auto_reload: (typeof currentAutoReload === 'boolean') ? currentAutoReload : true
      }

      // If the current value(s) are boolean, then we want to toggle them to
      // their opposite value. If they aren't a legitimate boolean, we'll leave
      // things alone and stay with the defaults we previously calculated.
      if (typeof currentDebug === 'boolean') {
        Object.keys(twigConfigTemplate).map((objectKey, index, array) => {
          twigConfigTemplate[objectKey] = (twigConfigTemplate[objectKey] === true) ? false : true
        })
      }

      dataAsYaml['parameters']['twig.config'] = twigConfigTemplate

      writeDevelopmentServicesYaml(filePath, dataAsYaml)
    })
  });
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
    console.log(`Unable to parse ${filePath} as YAML`)
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
      console.log(err)
      return
    }

    console.log(`Updated ${filePath}!`)
  });
}

exports.toggleTwigDebugConfig = toggleTwigDebugConfig
