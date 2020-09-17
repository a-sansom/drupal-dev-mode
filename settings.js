'use strict';

const fs = require('fs')

module.exports = function(DevModeEvents) {
  let dme = DevModeEvents

  /**
   * Define a SettingsLocalBlock object.
   *
   * Represents the out of the box settings.php settings.local.php inclusion
   * code block value in commented and uncommented forms, as per the out of
   * the box Drupal settings.php file.
   *
   * Property values are very specific. Anything more general requires, when
   * it comes to matching, use of custom regex etc. There are packages such as
   * 'strip-comments' but they don't deal with hash comments. Even if we go
   * for custom regex, we would still need to match string across multiple
   * lines, before processing.
   */
  class SettingsLocalBlock {
    constructor() {
      // Default code block from default.settings.php file that's distributed
      // with Drupal.
      this.commented = `
# if (file_exists($app_root . '/' . $site_path . '/settings.local.php')) {
#   include $app_root . '/' . $site_path . '/settings.local.php';
# }
`
      // Uncommented version of the code block.
      this.uncommented = `
if (file_exists($app_root . '/' . $site_path . '/settings.local.php')) {
  include $app_root . '/' . $site_path . '/settings.local.php';
}
`
    }

  }

  /**
   * Represents the current state of settings.local.php inclusion code block.
   *
   * @param {string} data Contents of the Drupal settings.php file.
   * @param {SettingsLocalBlock} block Representation of the state of the
   * settings.local.php inclusion code block, commented or uncommented etc.
   */
  class SettingsLocalBlockState {
    constructor(data, block) {
      this.settings = data
      this.block = block
      this.isCommented = null
      this.isUncommented = null
    }

    isBlockFound = function () {
      return !(this.isBlockCommented() === false && this.isBlockUncommented() === false);
    }

    isBlockCommented = function () {
      if (this.isCommented === null) {
        this.isCommented = this.settings.includes(this.block.commented)
      }

      return this.isCommented
    }

    isBlockUncommented = function () {
      if (this.isUncommented === null) {
        this.isUncommented = this.settings.includes(this.block.uncommented)
      }

      return this.isUncommented
    }

  }

  /**
   * Toggle the inclusion of settings.local.php on/off in settings.php.
   *
   * @param {string} filePath Path to the Drupal settings.php file.
   * @param {null|SettingsLocalBlock}customBlock Null or a SettingsLocalBlock object.
   */
  function toggleSettingsLocalInclusion(filePath, customBlock = null) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        dme.emit('settingsReadFailure', err)
        return
      }

      getSettingsLocalBlockState(data, customBlock, (err, blockState) => {
        if (err) {
          dme.emit('settingsSettingsLocalBlockNotFound', err)
          return
        }

        if (blockState.isBlockCommented()) {
          writeSettingsWithSettingsLocalEnabled(filePath, blockState)
        }
        else {
          writeSettingsWithSettingsLocalDisabled(filePath, blockState)
        }
      })
    })
  }

  /**
   * Enable inclusion of settings.local.php code block in settings.php.
   *
   * @param {string} filePath Path to the Drupal settings.php file.
   * @param {null|SettingsLocalBlock}customBlock Null or a SettingsLocalBlock object.
   */
  function enableSettingsLocal(filePath, customBlock = null) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        dme.emit('settingsReadFailure', err)
        return
      }

      getSettingsLocalBlockState(data, customBlock, (err, blockState) => {
        if (err) {
          dme.emit('settingsSettingsLocalBlockNotFound', err)
          return
        }

        if (blockState.isBlockUncommented()) {
          console.log('Settings local block is already uncommented!')
          return
        }

        writeSettingsWithSettingsLocalEnabled(filePath, blockState)
      })
    })
  }

  /**
   * Disable inclusion of settings.local.php code block in settings.php.
   *
   * @param {string} filePath Path to the Drupal settings.php file.
   * @param {null|SettingsLocalBlock} customBlock Null or a SettingsLocalBlock object.
   */
  function disableSettingsLocal(filePath, customBlock = null) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        dme.emit('settingsReadFailure', err)
        return
      }

      getSettingsLocalBlockState(data, customBlock, (err, blockState) => {
        if (err) {
          dme.emit('settingsSettingsLocalBlockNotFound', err)
          return
        }

        if (blockState.isBlockCommented()) {
          console.log('Settings local block is already commented out!')
          return
        }

        writeSettingsWithSettingsLocalDisabled(filePath, blockState)
      })
    })
  }

  /**
   * Get a SettingsLocalBlockState object and pass on to a callback function.
   *
   * @param {string} data Contents of the Drupal settings.php file.
   * @param {null|SettingsLocalBlock} customBlock Null or a SettingsLocalBlock object.
   * @param {function} callback Function to call with state of code inclusion block.
   */
  function getSettingsLocalBlockState(data, customBlock, callback) {
    let err = null
    let block = getSettingsLocalBlock(customBlock)
    const blockState = new SettingsLocalBlockState(data, block)

    if (!blockState.isBlockFound()) {
      err = new Error('Unable to match a settings.local.php inclusion code block to manipulate!')
    }

    callback(err, blockState)
  }

  /**
   * Get a SettingsLocalBlock object
   *
   * Returns either the default or a customised version of the default that is
   * defined by a calling script.
   *
   * @param {null|SettingsLocalBlock} customBlock Null or a SettingsLocalBlock object.
   * @return {SettingsLocalBlock} An SettingsLocalBlock object.
   */
  function getSettingsLocalBlock(customBlock) {
    let block = new SettingsLocalBlock()

    // Custom block used when code block that includes settings.local.php has
    // deviated from the out of the box version. Can be set by any calling
    // script.
    if (customBlock instanceof SettingsLocalBlock) {
      block = customBlock
    }

    return block
  }

  /**
   * Writes the settings.php file with settings.local.php uncommented.
   *
   * @param {string} filePath Path to the Drupal settings.php file.
   * @param {SettingsLocalBlockState} blockState A SettingsLocalBlockState object.
   */
  function writeSettingsWithSettingsLocalEnabled(filePath, blockState) {
    writeSettings(
      filePath,
      blockState.settings.replace(blockState.block.commented, blockState.block.uncommented),
      'Enable settings.local.php inclusion'
    )
  }

  /**
   * Writes the settings.php file with settings.local.php commented out.
   *
   * @param {string} filePath Path to the Drupal settings.php file.
   * @param {SettingsLocalBlockState} blockState A SettingsLocalBlockState object.
   */
  function writeSettingsWithSettingsLocalDisabled(filePath, blockState) {
    writeSettings(
      filePath,
      blockState.settings.replace(blockState.block.uncommented, blockState.block.commented),
      'Disable settings.local.php inclusion'
    )
  }

  /**
   * Writes the settings.php file contents.
   *
   * @param {string} filePath Path to the Drupal settings.php file.
   * @param {string} data Contents of the Drupal settings.php file.
   * @param {string} reason Reason for writing the file.
   */
  function writeSettings(filePath, data, reason) {
    fs.writeFile(filePath, data, (err) => {
      if (err) {
        dme.emit('settingsWriteFailure', err)
        return
      }

      dme.emit('settingsWritten', filePath, reason)
    })
  }

  return {
    getSettingsLocalBlockState: getSettingsLocalBlockState,
    SettingsLocalBlock: SettingsLocalBlock,
    SettingsLocalBlockState: SettingsLocalBlockState,
    toggleSettingsLocalInclusion: toggleSettingsLocalInclusion,
    enableSettingsLocal: enableSettingsLocal,
    disableSettingsLocal: disableSettingsLocal
  }
}
