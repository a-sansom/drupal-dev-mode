'use strict';

const fs = require('fs')

/**
 * Define a SingleLineSettingState object.
 *
 * @param {string} data Contents of a settings.local.php file.
 * @param {array} settingAddress An 'address' to a $settings variable.
 *
 * @todo This may be able to be split out into smaller objects (especially
 * some of the setting/variable matching logic/functions?).
 */
class SingleLineSettingState {
  constructor(data, settingAddress) {
    this.localSettings = data
    this.exists = null
    this.phpVar = null
    this.isCommented = null
    this.isUncommented = null
    this.commentType = null
  }

  /**
   * Determine if a Drupal settings exists in settings.local.php.
   *
   * An 'address' here is an array of strings such as ['a', 'b', 'c']. This
   * is the 'address' of the (imaginary) Drupal single line variable
   * $settings['a']['b']['c'] = 'd'; in the contents of the Drupal
   * settings.local.php file. We try and find that variable with and without
   * any single line comment prefix in the contents of the file.
   *
   * If it's determined that the setting with the 'address' is both *not*
   * uncommented AND *not* commented (which cannot both be true at the same
   * time) then the setting is deemed not to exist. If a setting is found to
   * be commented OR uncommented, it exists in the file.
   *
   * @param {array} settingAddress An 'address' to a $settings variable.
   * @return {boolean} If the setting at the address exists, or not.
   */
  settingExists = function (settingAddress) {
    if (this.exists === null) {
      this.exists = !(
        this.isSettingUncommented(settingAddress) === false &&
        this.isSettingCommented(settingAddress) === false
      )
    }

    return this.exists
  }

  /**
   * Determine if the Drupal setting at an 'address' is uncommented.
   *
   * Also see description of this.settingExists().
   *
   * @param {array} settingAddress An 'address' to a $settings variable.
   * @return {boolean} Whether or not the setting is uncommented, or not.
   */
  isSettingUncommented = function (settingAddress) {
    if (this.isUncommented === null) {
      const pattern = this.buildVariableUncommentedMatchPattern(
        this.getSettingPhpVar(settingAddress)
      )
      const re = new RegExp(pattern, 'gm')

      this.isUncommented = re.test(this.localSettings)
    }

    return this.isUncommented
  }

  /**
   * Determine if the Drupal setting at an 'address' is commented out.
   *
   * Also see description of this.settingExists().
   *
   * @param {array} settingAddress An 'address' to a $settings variable.
   * @return {boolean} Whether or not the setting is commented out, or not.
   */
  isSettingCommented = function (settingAddress) {
    if (this.isCommented === null) {
      // Handle multiple types of single-line comment.
      // Drupal uses '#' out of the box in the example local settings file.
      const lineCommentPrefixes = ['#', '//']
      const callback = prefix => {
        const pattern = this.buildVariableCommentedMatchPattern(
          prefix,
          this.getSettingPhpVar(settingAddress)
        )
        const re = new RegExp(pattern, 'gm')
        const matched = re.test(this.localSettings)

        if (matched) {
          this.commentType = prefix
        }

        return matched
      };

      // If *any* type of single line comment is used for the setting.
      this.isCommented = lineCommentPrefixes.some(callback)
    }

    return this.isCommented
  }

  /**
   * Build a regex pattern to match an uncommented single line PHP variable.
   *
   * @param {string} phpVar A PHP variable string Eg. $setting['x']['y']
   * @return {string} Regex pattern to match an uncommented PHP variable.
   */
  buildVariableUncommentedMatchPattern = function (phpVar) {
    return '^\\s*'
      .concat(this.buildPhpVarMatchPattern(phpVar))
      .concat('$')
  }

  /**
   * Build a regex pattern to match a commented out single line PHP variable.
   *
   * @param {string} prefix A PHP single line comment prefix. Eg. # or //
   * @param {string} phpVar A PHP variable string Eg. $setting['x']['y']
   * @return {string} Regex pattern to match a commented PHP out variable.
   */
  buildVariableCommentedMatchPattern = function (prefix, phpVar) {
    return '^\\s*'
      // @todo Can this replace(...) go somewhere better?
      .concat(prefix.replace(/\//g, '\\/'))
      .concat('\\s*')
      .concat(this.buildPhpVarMatchPattern(phpVar))
      .concat('$')
  }

  /**
   * Build a regex pattern to match a single line PHP variable.
   *
   * Returned pattern has two groups, one for the whole variable and value
   * assignment, the second just the variable's assigned value.
   *
   * @param {string} phpVar A PHP variable string Eg. $setting['x']['y']
   * @return {string} Regex pattern to match the variable, and its value.
   */
  buildPhpVarMatchPattern = function (phpVar) {
    return '('
      .concat(this.escapePhpVarForRegEx(phpVar))
      .concat('\\s*=\\s*(.+);')
      .concat(')')
  }

  /**
   * Get PHP syntax for a settings.local.php setting.
   *
   * Given an address of the setting, in array form. If you want the syntax
   * for the render cache setting, the 'address' in the Drupal '$settings'
   * variable is:
   *
   *     ['cache', 'bins', 'render']
   *
   * ...which will return a string for the PHP variable:
   *
   *     $settings['cache']['bins']['render']
   *
   * @param {array} settingAddress Address of the Drupal setting, as an array.
   * @return {string} PHP syntax of the setting.
   */
  getSettingPhpVar = function (settingAddress) {
    if (this.phpVar === null) {
      const prefix = '$settings'
      const arrayified = settingAddress.map(function (currentValue) {
        return "['".concat(currentValue).concat("']")
      })

      this.phpVar = prefix.concat(arrayified.join(''))
    }

    return this.phpVar
  }

  /**
   * Escape a PHP variable string for use with regular expressions.
   *
   * @param {string} phpVar A PHP variable string Eg. $setting['x']['y']
   * @return {string} PHP variable string escaped ready for use with regex. Eg. \\$setting\\['x']\\['y']
   */
  escapePhpVarForRegEx = function (phpVar) {
    // Replace '$' with '\\$'.
    phpVar = phpVar.replace('$', '\\$')
    // Replace '[' with '\\['.
    phpVar = phpVar.replace(/\[/g, '\\[')

    return phpVar
  }

}

/**
 * Toggle multiple settings.local.php settings commented/uncommented state.
 *
 * @param {string} filePath Path to the settings.local.php being updated.
 * @param {string} localSettings Contents of settings.local.php file.
 * @param {array} settingsAddresses List of $settings addresses to toggle.
 */
function toggleSettingsInclusion(filePath, localSettings, settingsAddresses) {
  settingsAddresses.forEach(function (settingAddress) {
    localSettings = toggleSettingInclusion(localSettings, settingAddress)
  });

  fs.writeFile(filePath, localSettings, function(err) {
    if (err) {
      console.log(err)
      return
    }

    console.log(`Updated ${filePath}!`)
  })
}

/**
 * Toggle a single settings.local.php setting's commented/uncommented state.
 *
 * @param {string} localSettings Contents of settings.local.php file.
 * @param {array} settingAddress An 'address' to a $settings variable.
 * @return {string} Input localSettings with addressed setting toggled to the
 * opposite of its input state. Ie. If it was uncommented, it is now
 * commented out, and vice-versa.
 */
function toggleSettingInclusion(localSettings, settingAddress) {
  const settingState = new SingleLineSettingState(localSettings, settingAddress)
  const phpVar = settingState.getSettingPhpVar(settingAddress)

  if (!settingState.settingExists(settingAddress)) {
    console.log(`Setting ${phpVar} does not exist in settings.local.php`)
  }
  else if (settingState.isSettingUncommented(settingAddress)) {
    console.log(`Commenting out ${phpVar}`)

    localSettings = commentOutSetting(settingState, phpVar, localSettings)
  }
  else if (settingState.isSettingCommented(settingAddress)) {
    console.log(`Uncommenting ${phpVar}`)

    localSettings = uncommentSetting(settingState, phpVar, localSettings)
  }
  else {
    console.log(`Unable to determine change required for ${phpVar}`)
  }

  return localSettings
}

/**
 * Updates string representing the contents of settings.local.php to comment
 * out a setting.
 *
 * @param {object} settingState A SingleLineSettingState for a setting.
 * @param {string} phpVar A PHP variable string Eg. $setting['x']['y']
 * @param {string} localSettings Contents of settings.local.php file.
 * @return {string} Input localSettings with the setting now commented out.
 */
function commentOutSetting(settingState, phpVar, localSettings) {
  const pattern = settingState.buildVariableUncommentedMatchPattern(phpVar)
  const re = new RegExp(pattern, 'gm')

  return localSettings.replace(re, "# $1")
}

/**
 * Updates string representing the contents of settings.local.php to uncomment
 * a setting.
 *
 * @param {object} settingState A SingleLineSettingState for a setting.
 * @param {string} phpVar A PHP variable string Eg. $setting['x']['y']
 * @param {string} localSettings Contents of settings.local.php file.
 * @return {string} Input localSettings with the setting now uncommented.
 */
function uncommentSetting(settingState, phpVar, localSettings) {
  const comment = settingState.commentType
  const pattern = settingState.buildVariableCommentedMatchPattern(comment, phpVar)
  const re = new RegExp(pattern, 'gm')

  return localSettings.replace(re, "$1")
}

/**
 * Toggle (a number of) Drupal cache settings settings.local.php inclusion.
 * @param {string} filePath Path to the settings.local.php being updated.
 * @param {array} cacheSettingsAddresses List of cache-related $settings addresses to toggle.
 */
function toggleCachesNullifyInclusion(filePath, cacheSettingsAddresses) {
  if (!Array.isArray(cacheSettingsAddresses) || cacheSettingsAddresses.length < 1) {
    console.log('No cache settings specified to toggle inclusion of!')
    return
  }

  fs.readFile(filePath, 'utf8', function (err, data) {
    if (err) {
      console.log(err)
      return
    }

    toggleSettingsInclusion(filePath, data, cacheSettingsAddresses)
  })
}

module.exports.toggleCachesNullifyInclusion = toggleCachesNullifyInclusion