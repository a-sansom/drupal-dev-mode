const dme = require('./DevModeEvents.js')
const DevModeEvents = new dme.DevModeEvents()

const settingsLocal = require('./settingsLocal.js')(DevModeEvents);

const settingsLocalFileData = `
# Some other code...
# $settings['cache']['bins']['render'] = 'cache.backend.null';
# $settings['cache']['bins']['discovery_migration'] = 'cache.backend.memory';
# $settings['cache']['bins']['page'] = 'cache.backend.null';
# $settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
# Some other code...
`

const fs = require('fs')
jest.mock('fs');

describe('Tests for SingleLineSettingState', () => {
  test('Test setting exists, as expected', () => {
    const settingState = new settingsLocal.SingleLineSettingState(settingsLocalFileData)
    const settingAddress = ['cache', 'bins', 'render']

    expect(settingState.settingExists(settingAddress)).toBe(true)
  })

  test('Test setting does not exist, as expected', () => {
    const settingState = new settingsLocal.SingleLineSettingState(settingsLocalFileData)
    const settingAddress = ['does', 'not', 'exist']

    expect(settingState.settingExists(settingAddress)).toBe(false)
  })

  test('Test setting exists commented, as expected', () => {
    const settingState = new settingsLocal.SingleLineSettingState(settingsLocalFileData)
    const settingAddress = ['cache', 'bins', 'render']

    expect(settingState.settingExists(settingAddress)).toBe(true)
    expect(settingState.isSettingCommented(settingAddress)).toBe(true)
    expect(settingState.isSettingUncommented(settingAddress)).toBe(false)
  })

  test('Test setting exists uncommented, as expected', () => {
    const settingsLocalFileData = `
# Some other code...
$settings['cache']['bins']['render'] = 'cache.backend.null';
# $settings['cache']['bins']['discovery_migration'] = 'cache.backend.memory';
# $settings['cache']['bins']['page'] = 'cache.backend.null';
# $settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
# Some other code...
`
    const settingState = new settingsLocal.SingleLineSettingState(settingsLocalFileData)
    const settingAddress = ['cache', 'bins', 'render']

    expect(settingState.settingExists(settingAddress)).toBe(true)
    expect(settingState.isSettingCommented(settingAddress)).toBe(false)
    expect(settingState.isSettingUncommented(settingAddress)).toBe(true)
  })

  test('Test building PHP variable from "address"', () => {
    const settingState = new settingsLocal.SingleLineSettingState(settingsLocalFileData)
    const settingAddress = ['cache', 'bins', 'render']

    expect(settingState.getSettingPhpVar(settingAddress)).toEqual("$settings['cache']['bins']['render']")
  })

  test('Test escaping PHP variable from "address", for regex use', () => {
    const settingState = new settingsLocal.SingleLineSettingState(settingsLocalFileData)
    const phpVar = "$settings['cache']['bins']['render']"

    expect(settingState.escapePhpVarForRegEx(phpVar)).toEqual("\\$settings\\['cache']\\['bins']\\['render']")
  })
});

describe('Tests toggling setting inclusion/exclusion', () => {

  const renderCacheUncommented = `
# Some other code...
$settings['cache']['bins']['render'] = 'cache.backend.null';
# $settings['cache']['bins']['discovery_migration'] = 'cache.backend.memory';
# $settings['cache']['bins']['page'] = 'cache.backend.null';
# $settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
# Some other code...
`
  const renderAndPageCacheUncommented = `
# Some other code...
$settings['cache']['bins']['render'] = 'cache.backend.null';
# $settings['cache']['bins']['discovery_migration'] = 'cache.backend.memory';
$settings['cache']['bins']['page'] = 'cache.backend.null';
# $settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
# Some other code...
`

  test('Include excluded setting(s)', () => {
    // Start with all settings commented out.
    let settingAddress = ['cache', 'bins', 'render']
    let received = settingsLocal.toggleSettingInclusion(settingsLocalFileData, settingAddress)

    // Render cache setting should now be uncommented.
    expect(received).toEqual(renderCacheUncommented)

    settingAddress = ['cache', 'bins', 'page']
    received = settingsLocal.toggleSettingInclusion(received, settingAddress)

    // Render AND page cache settings should now be uncommented.
    expect(received).toEqual(renderAndPageCacheUncommented)
  })

  test('Exclude included setting(s)', () => {
    // The reverse of the previous test.
    // Start with both cache settings uncommented and work back to them both
    // being commented.
    let settingAddress = ['cache', 'bins', 'page']
    let received = settingsLocal.toggleSettingInclusion(renderAndPageCacheUncommented, settingAddress)

    // Only render cache setting should now be uncommented.
    expect(received).toEqual(renderCacheUncommented)

    settingAddress = ['cache', 'bins', 'render']
    received = settingsLocal.toggleSettingInclusion(received, settingAddress)

    // Render AND page cache settings should now be commented.
    expect(received).toEqual(settingsLocalFileData)
  })
});

describe('Test toggleSettingsInclusion events emitted', () => {
  test('Test settingsLocalReadFailure emitted', () => {
    fs.readFile.mockImplementation((filePath, options, callback) => {
      callback('Non-null value to force event to be emitted', '')
    })

    const handler = jest.fn().mockName('settingsLocalReadFailureHandler')
    DevModeEvents.on('settingsLocalReadFailure', handler)

    settingsLocal.toggleCachesNullifyInclusion('/settings.local.php', ['path', 'to', 'setting'])

    expect(handler).toBeCalledTimes(1)
  })

  test('Test settingsLocalWriteFailure emitted (single setting)', () => {
    fs.writeFile.mockImplementation((filePath, config, callback) => {
      callback('Non-null value to force event to be emitted')
    })

    const failureHandler = jest.fn().mockName('failureHandler')
    const successHandler = jest.fn().mockName('successHandler')
    DevModeEvents.on('settingsLocalWriteFailure', failureHandler)
    DevModeEvents.on('settingsLocalWritten', successHandler)

    const address = [['path', 'to', 'setting']]
    settingsLocal.toggleSettingsInclusion('/settings.local.php', '', address)

    expect(failureHandler).toBeCalledTimes(1)
    expect(successHandler).toBeCalledTimes(0)
  })

  test('Test settingsLocalWriteFailure emitted (multiple settings)', () => {
    fs.writeFile.mockImplementation((filePath, config, callback) => {
      callback('Non-null value to force event to be emitted')
    })

    const failureHandler = jest.fn().mockName('failureHandler')
    const successHandler = jest.fn().mockName('successHandler')
    DevModeEvents.on('settingsLocalWriteFailure', failureHandler)
    DevModeEvents.on('settingsLocalWritten', successHandler)

    const addresses = [
      ['path', 'to', 'setting1'],
      ['path', 'to', 'setting2'],
    ]
    settingsLocal.toggleSettingsInclusion('/settings.local.php', '', addresses)

    expect(failureHandler).toBeCalledTimes(1)
    expect(successHandler).toBeCalledTimes(0)
  })

  test('Test settingsLocalWritten emitted', () => {
    fs.writeFile.mockImplementation((filePath, config, callback) => {
      callback(null)
    })

    const failureHandler = jest.fn().mockName('failureHandler')
    const successHandler = jest.fn().mockName('successHandler')
    DevModeEvents.on('settingsLocalWriteFailure', failureHandler)
    DevModeEvents.on('settingsLocalWritten', successHandler)

    const addresses = [
      ['path', 'to', 'setting1'],
      ['path', 'to', 'setting2'],
    ]
    settingsLocal.toggleSettingsInclusion('/settings.local.php', '', addresses)

    expect(failureHandler).toBeCalledTimes(0)
    expect(successHandler).toBeCalledTimes(1)
  })
});
