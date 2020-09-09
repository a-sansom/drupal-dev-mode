#!/usr/bin/env node

'use strict';

const drupalPaths = require('./drupalPaths.js')
const developmentServices = require('./developmentServices.js')
const settings = require('./settings.js')
const settingsLocal = require('./settingsLocal.js')

const filePaths = drupalPaths.getFilePathsList()

/**
 * Toggle Drupal's 'dev mode' on/off, if all dependencies to do so have been
 * met.
 */
if (fileDependenciesHaveBeenMet(filePaths)) {

  /**
   * Toggle (adding, if required) Twig debug settings to Drupal development.services.yml.
   */
  developmentServices.toggleTwigDebugConfig(filePaths.developmentServicesYaml)

  /**
   * Control inclusion of settings.local.php in Drupal settings.php.
   */
  settings.toggleSettingsLocalInclusion(filePaths.settingsPhp)

  /**
   * Control inclusion of various cache settings in settings.local.php.
   */
  const cacheSettingsAddresses = [
    ['cache', 'bins', 'render'],
    ['cache', 'bins', 'page'],
    ['cache', 'bins', 'dynamic_page_cache']
  ]
  settingsLocal.toggleCachesNullifyInclusion(filePaths.settingsLocalPhp, cacheSettingsAddresses)
}

/**
 * Determine whether or not we've got paths to files involved in Drupal 'dev
 * mode'.
 *
 * @param {object} filePaths List of Drupal file paths involved in 'dev mode'.
 * @return {boolean} Whether all the file dependencies have been met, or not.
 */
function fileDependenciesHaveBeenMet(filePaths) {
  if (!filePaths.developmentServicesYaml || !filePaths.settingsPhp || !filePaths.settingsLocalPhp) {
    console.log('Unmet dependencies for Drupal dev mode to be enabled/disabled!')
    console.log('development.services.yml path is ' + filePaths.developmentServicesYaml)
    console.log('settings.php path is ' + filePaths.settingsPhp)
    console.log('settings.local.php path is ' + filePaths.settingsLocalPhp)

    return false
  }

  return true
}