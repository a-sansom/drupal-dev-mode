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
  console.log('\nUnmet dependencies for Drupal dev mode to be enabled/disabled!\n')
  console.log(`The development.services.yml path is ${filePaths.developmentServicesYaml}`)
  console.log(`The settings.php path is ${filePaths.settingsPhp}`)
  console.log(`The settings.local.php path is ${filePaths.settingsLocalPhp}\n`)
})

DevModeEvents.on('drupalFilePathsVerifySuccess', (filePaths) => {
  /**
   * Toggle (adding, if required) Twig debug settings to Drupal development.services.yml.
   */
  developmentServices.toggleTwigDebugConfig(filePaths.developmentServicesYaml)
})

// Handlers for developmentServices module generated events.
DevModeEvents.on('developmentServicesReadFailure', (err) => {
  console.log(err)
})

DevModeEvents.on('developmentServicesParseYamlFailure', (err) => {
  console.log(err)
})

DevModeEvents.on('developmentServicesWritten', (filePath) => {
  console.log(`Updated ${filePath}`)

  /**
   * Control inclusion of settings.local.php in Drupal settings.php.
   */
  const filePaths = DevModeEvents.getFilePaths()
  settings.toggleSettingsLocalInclusion(filePaths.settingsPhp)
})

DevModeEvents.on('developmentServicesWriteFailure', (err) => {
  console.log(err)
})

// Handlers for settings module generated events.
DevModeEvents.on('settingsReadFailure', (err) => {
  console.log(err)
})

DevModeEvents.on('settingsSettingsLocalBlockNotFound', (err) => {
  console.log(err)
})

DevModeEvents.on('settingsWritten', (filePath, reason) => {
  console.log(`Updated ${filePath} (${reason})`)

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
  console.log(err)
})

// Handlers for settingsLocal module generated events.
DevModeEvents.on('settingsLocalReadFailure', (err) => {
  console.log(err)
})

DevModeEvents.on('settingsLocalWritten', (filePath) => {
  /**
   * When we've got this far, we're finished!
   */
  console.log(`Updated ${filePath}`)
  console.log('toggle-dev-mode is complete!')
})

DevModeEvents.on('settingsLocalWriteFailure', (err) => {
  console.log(err)
})

/**
 * Trigger chain of events to verify various files exist, before updating.
 */
drupalPaths.verifyDrupalFilePaths(filePaths)
