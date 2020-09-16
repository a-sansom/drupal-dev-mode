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
