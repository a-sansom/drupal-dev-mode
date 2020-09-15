#!/usr/bin/env node

'use strict';

const drupalPaths = require('./drupalPaths.js')
const developmentServices = require('./developmentServices.js')
const settings = require('./settings.js')
const settingsLocal = require('./settingsLocal.js')

const installPath = drupalPaths.getInstallPath()
const filePaths = drupalPaths.getFilePathsList(installPath)

/**
 * Toggle Drupal's 'dev mode' on/off, if all dependencies to do so have been
 * met.
 */
if (drupalPaths.fileDependenciesHaveBeenMet(filePaths)) {

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
