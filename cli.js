#!/usr/bin/env node

'use strict';

const dme = require('./DevModeEvents.js')
const DevModeEvents = new dme.DevModeEvents()

const drupalPaths = require('./drupalPaths.js')(DevModeEvents)
const developmentServices = require('./developmentServices.js')(DevModeEvents)
const settings = require('./settings.js')(DevModeEvents)
const settingsLocal = require('./settingsLocal.js')(DevModeEvents)

const installPath = drupalPaths.getInstallPath()
const filePaths = drupalPaths.getFilePathsList(installPath)

DevModeEvents.on('drupalFilePathsVerifyFailure', (filePaths) => {
  /**
   * Report what went wrong with the (calculated) Drupal file paths.
   */
  DevModeEvents.addlogs([
    'Unmet dependencies for Drupal dev mode to be enabled/disabled!',
    `development.services.yml path is ${filePaths.developmentServicesYaml}`,
    `settings.php path is ${filePaths.settingsPhp}`,
    `settings.local.php path is ${filePaths.settingsLocalPhp}`
  ])

  console.table(DevModeEvents.getLogForConsoleTable())
})

DevModeEvents.on('drupalFilePathsVerifySuccess', (filePaths) => {
  /**
   * Toggle (adding, if required) Twig debug settings to Drupal development.services.yml.
   */
  developmentServices.toggleTwigDebugConfig(filePaths.developmentServicesYaml)
})

// Handlers for developmentServices module generated events.
DevModeEvents.on('developmentServicesReadFailure', (err) => {
  console.table(DevModeEvents.getLogForConsoleTable())
  console.log(err)
})

DevModeEvents.on('developmentServicesParseYamlFailure', (err) => {
  console.table(DevModeEvents.getLogForConsoleTable())
  console.log(err)
})

DevModeEvents.on('developmentServicesWritten', (filePath) => {
  DevModeEvents.addlog(`Updated ${filePath}`)

  /**
   * Control inclusion of settings.local.php in Drupal settings.php.
   */
  const filePaths = DevModeEvents.getFilePaths()
  settings.toggleSettingsLocalInclusion(filePaths.settingsPhp)
})

DevModeEvents.on('developmentServicesWriteFailure', (err) => {
  console.table(DevModeEvents.getLogForConsoleTable())
  console.log(err)
})

// Handlers for settings module generated events.
DevModeEvents.on('settingsReadFailure', (err) => {
  console.table(DevModeEvents.getLogForConsoleTable())
  console.log(err)
})

DevModeEvents.on('settingsSettingsLocalBlockNotFound', (err) => {
  console.table(DevModeEvents.getLogForConsoleTable())
  console.log(err)
})

DevModeEvents.on('settingsWritten', (filePath, reason) => {
  DevModeEvents.addlog(`Updated ${filePath}`)

  /**
   * Control inclusion of various cache settings in settings.local.php.
   */
  const filePaths = DevModeEvents.getFilePaths()
  const cacheSettingsAddresses = [
    ['cache', 'bins', 'render'],
    ['cache', 'bins', 'page'],
    ['cache', 'bins', 'dynamic_page_cache']
  ]
  settingsLocal.toggleCachesNullifyInclusion(filePaths.settingsLocalPhp, cacheSettingsAddresses)
})

DevModeEvents.on('settingsWriteFailure', (err) => {
  console.table(DevModeEvents.getLogForConsoleTable())
  console.log(err)
})

// Handlers for settingsLocal module generated events.
DevModeEvents.on('settingsLocalReadFailure', (err) => {
  console.table(DevModeEvents.getLogForConsoleTable())
  console.log(err)
})

DevModeEvents.on('settingsLocalWritten', (filePath) => {
  DevModeEvents.addlog(`Updated ${filePath}`)

  console.table(DevModeEvents.getLogForConsoleTable())
})

DevModeEvents.on('settingsLocalWriteFailure', (err) => {
  console.table(DevModeEvents.getLogForConsoleTable())
  console.log(err)
})

/**
 * Trigger chain of events to verify various files exist, before updating.
 */
drupalPaths.verifyDrupalFilePaths(filePaths)
