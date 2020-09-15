/**
 * @file Functionality for finding/building paths to Drupal files involved in
 * Drupal's 'dev mode'.
 */
'use strict';

const fs = require('fs')
const path = require('path')

/**
 * Get file paths that are involved in Drupal 'dev mode'.
 *
 * @param {null|string} installPath Path to directory Drupal is installed in.
 * @param {string} siteName Name of Drupal site to use in file paths (multisite etc).
 * @return {object} Object with properties with either null or absolute file path values.
 */
function getFilePathsList(installPath, siteName = 'default') {
  let paths = {
    'developmentServicesYaml': null,
    'settingsLocalPhp': null,
    'settingsPhp': null
  }

  if (installPath) {
    const sitesPath = getSitesPath(installPath)

    paths.developmentServicesYaml = getDevelopmentServicesFilePath(sitesPath)
    paths.settingsLocalPhp = getSettingsLocalFilePath(sitesPath, siteName)
    paths.settingsPhp = getSettingsFilePath(sitesPath, siteName)
  }

  return paths
}

/**
 * Get the Drupal installation path.
 *
 * Expectation is that the 'node_modules' folder (that this package is
 * installed in) is a sibling of the Drupal install (which is the case for our
 * Lando-based site). Looks to see if any of the commonly named Drupal
 * directories are in existence, and returns path to the first one found.
 *
 * @todo Provide an array param of other directory names and merge with
 * commonInstallDirs, so that we're no longer limited to just those.
 *
 * @return {string|null} Path the Drupal install directory, or null.
 */
function getInstallPath() {
  // @todo Maybe process.cwd might be useful here?
  const basePath = path.resolve(__dirname, '../..')
  const commonInstallDirs = ['docroot', 'drupal', 'web']

  for (const dirName of commonInstallDirs) {
    const installPath = basePath.concat(path.sep)
      .concat(dirName)

    if (fs.existsSync(installPath)) {
      return installPath
    }
  }

  console.log('Unable to find root of the Drupal installation! Unable to continue.')

  return null
}

/**
 * Get the Drupal installation's 'sites' path.
 *
 * @param {string} installPath Drupal installation directory path.
 * @return {string} Path to the 'sites' directory.
 */
function getSitesPath(installPath) {
  return installPath.concat(path.sep)
    .concat('sites')
}

/**
 * Get the Drupal installation's 'development.services.yml' file path.
 *
 * The development.services.yml file is an out of the box file. We shouldn't
 * need to check for existence of it.
 *
 * @param {string} sitesPath Drupal installation 'sites' directory path.
 * @return {string} Path to the 'development.services.yml' file.
 */
function getDevelopmentServicesFilePath(sitesPath) {
  return sitesPath.concat(path.sep)
    .concat('development.services.yml')
}

/**
 * Get the Drupal installation's 'settings.local.php' file path.
 *
 * The settings.local.php file isn't an out of the box file, it needs to have
 * been created (manually, or by some other installer/configuration). It is
 * created from example.settings.local.php.
 *
 * @param {string} sitesPath Drupal installation 'sites' directory path.
 * @param {string} siteName Name of Drupal site to use in file paths (multisite etc).
 * @return {string} Path to the (default site) 'settings.local.php' file.
 */
function getSettingsLocalFilePath(sitesPath, siteName) {
  let filePath = sitesPath.concat(path.sep)
    .concat(siteName)
    .concat(path.sep)
    .concat('settings.local.php')

  if (!fs.existsSync(filePath)) {
    console.log(`The path ${filePath} is invalid!`)
    filePath = false
  }

  return filePath
}

/**
 * Get the Drupal installation's 'settings.php' file path.
 *
 * The settings.php file isn't an out of the box file, it needs to have been
 * created (manually, or by some other installer/configuration).
 *
 * @param {string} sitesPath Drupal installation 'sites' directory path.
 * @param {string} siteName Name of Drupal site to use in file paths (multisite etc).
 * @return {string} Path to the (default site) 'settings.php' file.
 */
function getSettingsFilePath(sitesPath, siteName) {
  let filePath = sitesPath.concat(path.sep)
    .concat(siteName)
    .concat(path.sep)
    .concat('settings.php')

  if (!fs.existsSync(filePath)) {
    console.log(`The path ${filePath} is invalid!`)
    filePath = false
  }

  return filePath
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
    console.log('\nUnmet dependencies for Drupal dev mode to be enabled/disabled!\n')
    console.log(`The development.services.yml path is ${filePaths.developmentServicesYaml}`)
    console.log(`The settings.php path is ${filePaths.settingsPhp}`)
    console.log(`The settings.local.php path is ${filePaths.settingsLocalPhp}\n`)

    return false
  }

  return true
}

exports.getInstallPath = getInstallPath
exports.getFilePathsList = getFilePathsList
exports.fileDependenciesHaveBeenMet = fileDependenciesHaveBeenMet