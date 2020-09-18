const dme = require('./DevModeEvents.js')
const DevModeEvents = new dme.DevModeEvents()

const settings = require('./settings.js')(DevModeEvents);
const defaultBlockFileData = `
# Some other code....

# if (file_exists($app_root . '/' . $site_path . '/settings.local.php')) {
#   include $app_root . '/' . $site_path . '/settings.local.php';
# }

# Some other code....
`

const fs = require('fs')
jest.mock('fs');

describe('Test settings.local.php inclusion code block', () => {
  test('(Default) block found, as expected', (done) => {
    function callback(err, blockState) {
      try {
        expect(err).toBeNull();
        expect(blockState.isBlockFound()).toBe(true)

        done();
      }
      catch (error) {
        done(error);
      }
    }

    settings.getSettingsLocalBlockState(defaultBlockFileData, null, callback)
  })

  test('(Default) block not found, as expected', (done) => {
    const cusomtBlockfileData = `
# Some other code....

# if (file_exists($app_root . '/' . $site_path . '/settings.local.php')) {
#   THIS LINE IS NOT PART OF THE DEFAULT CODE BLOCK!
#   include $app_root . '/' . $site_path . '/settings.local.php';
# }

# Some other code....
`

    function callback(err, blockState) {
      try {
        expect(err).not.toBeNull();
        expect(blockState.isBlockFound()).toBe(false)

        done();
      }
      catch (error) {
        done(error);
      }
    }

    settings.getSettingsLocalBlockState(cusomtBlockfileData, null, callback)
  })
});

describe('Test SettingsLocalBlockState', () => {
  test('(Default) block is found', () => {
    const block = new settings.SettingsLocalBlock()
    const blockState = new settings.SettingsLocalBlockState(
      defaultBlockFileData,
      block
    )

    expect(blockState.isBlockFound()).toBe(true)
  })

  test('(Default) block is commented out', () => {
    const block = new settings.SettingsLocalBlock()
    const blockState = new settings.SettingsLocalBlockState(
      defaultBlockFileData,
      block
    )

    expect(blockState.isBlockCommented()).toBe(true)
    expect(blockState.isBlockUncommented()).toBe(false)
  })

  test('(Default) block is uncommented', () => {
    const defaultBlockUncommentedFileData = `
# Some other code....

if (file_exists($app_root . '/' . $site_path . '/settings.local.php')) {
  include $app_root . '/' . $site_path . '/settings.local.php';
}

# Some other code....
`
    const block = new settings.SettingsLocalBlock()
    const blockState = new settings.SettingsLocalBlockState(
      defaultBlockUncommentedFileData,
      block
    )

    expect(blockState.isBlockCommented()).toBe(false)
    expect(blockState.isBlockUncommented()).toBe(true)
  })
});

describe('Test toggleSettingsLocalInclusion events emitted', () => {
  test('Test settingsReadFailure emitted', () => {
    fs.readFile.mockImplementation((filePath, options, callback) => {
      callback('Non-null value to force event to be emitted', '')
    })

    const handler = jest.fn().mockName('settingsReadFailureHandler')
    DevModeEvents.on('settingsReadFailure', handler)

    settings.toggleSettingsLocalInclusion('/settings.php', null)

    expect(handler).toBeCalledTimes(1)
  });

  //test('Test settingsSettingsLocalBlockNotFound emitted', () => {
  //})

  test('Test settingsWriteFailure emitted', () => {
    fs.writeFile.mockImplementation((filePath, config, callback) => {
      callback('Non-null value to force event to be emitted')
    })

    const failureHandler = jest.fn().mockName('failureHandler')
    const successHandler = jest.fn().mockName('successHandler')
    DevModeEvents.on('settingsWriteFailure', failureHandler)
    DevModeEvents.on('settingsWritten', successHandler)

    settings.writeSettings('/settings.php', '', 'Test write failure event')

    expect(failureHandler).toBeCalledTimes(1)
    expect(successHandler).toBeCalledTimes(0)
  })

  test('Test settingsWritten emitted', () => {
    fs.writeFile.mockImplementation((filePath, config, callback) => {
      callback(null)
    })

    const failureHandler = jest.fn().mockName('failureHandler')
    const successHandler = jest.fn().mockName('successHandler')
    DevModeEvents.on('settingsWriteFailure', failureHandler)
    DevModeEvents.on('settingsWritten', successHandler)

    settings.writeSettings('/settings.php', '', 'Test write success event')

    expect(failureHandler).toBeCalledTimes(0)
    expect(successHandler).toBeCalledTimes(1)
  })
});
