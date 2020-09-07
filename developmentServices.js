'use strict';

const fs = require('fs')
const YAML = require('yaml')

/**
 * Adds a 'twig.config' section to development services YAML file.
 * @param {string} filePath Path to development.services.yml file.
 * @param {boolean} debug Twig debugging is enabled, or not.
 * @param {boolean} autoReload Twig auto reload is enabled, or not.
 */
function addTwigConfig(filePath, debug, autoReload) {
  fs.readFile(filePath, 'utf8', function (err, data) {
    if (err) {
      // Failed to load/read the file.
      // Show why and exit.
      console.log(err)

      return
    }

    // File was read successfully.
    modifyDevelopmentServicesYaml(filePath, data, debug, autoReload)
  });
}

/**
 * Modify existing development services YAML.
 * @param {string} filePath Path to development.services.yml file.
 * @param {string} data Development services YAML settings, as a string.
 * @param {boolean} debug Twig debugging is enabled, or not.
 * @param {boolean} autoReload Twig auto reload is enabled, or not.
 */
function modifyDevelopmentServicesYaml(filePath, data, debug, autoReload) {
  // Got file contents, try and parse it as YAML and modify.
  let config = {}

  try {
    config = YAML.parse(data)
    // @todo Change this to merge with any existing settings, not overwrite.
    config.parameters['twig.config'] = {
      'debug': debug,
      'auto_reload': autoReload
    }
  }
  catch (err) {
    console.log(`Unable to parse ${filePath} as YAML`)
    console.log(err)
    return
  }

  writeDevelopmentServicesYaml(filePath, config)
}

/**
 * Write (updated) development services config (back) to file.
 * @param {string} filePath Path to development.services.yml file.
 * @param {Object} config Development services config as an object.
 */
function writeDevelopmentServicesYaml(filePath, config) {
  // NOTE: Any comments in the original files are lost! This appears to be
  // widely accepted as what happens across all YAML parsers/packages?
  fs.writeFile(filePath, YAML.stringify(config), function(err) {
    if (err) {
      console.log(err)
      return
    }

    console.log(`Updated ${filePath}!`)
  });
}

exports.addTwigConfig = addTwigConfig
