const dme = require('./DevModeEvents.js')
const DevModeEvents = new dme.DevModeEvents()

const drupalPaths = require('./drupalPaths.js')(DevModeEvents);

// Require fs so we can mock it's function return values.
const fs = require('fs')

jest.mock('fs')

describe('Drupal installation path test(s)', () => {
  beforeEach(() => {
    // Mock install dir never being found.
    fs.existsSync.mockReturnValue(false);
  });

  test('Test install path not found', () => {
    expect(drupalPaths.getInstallPath()).toBeNull();
  });

  test('Test all common install dirs are checked for existence', () => {
    const installPath = drupalPaths.getInstallPath()
    expect(fs.existsSync.mock.calls.length).toBe(3)
  });

  test('Test all common install AND custom dirs are checked for existence', () => {
    const installPath = drupalPaths.getInstallPath(['www-data', 'mysite'])
    expect(fs.existsSync.mock.calls.length).toBe(5)
  });
});

describe('Drupal "site" path tests', () => {
  beforeEach(() => {
    // Mock install dir being found.
    fs.existsSync.mockReturnValue(true);
  });

  test('Test default site paths', () => {
    expect(drupalPaths.getFilePathsList('/tmp'))
      .toEqual({
        'developmentServicesYaml': '/tmp/sites/development.services.yml',
        'settingsLocalPhp': '/tmp/sites/default/settings.local.php',
        'settingsPhp': '/tmp/sites/default/settings.php'
      });
  });

  test('Test non-default site paths', () => {
    expect(drupalPaths.getFilePathsList('/tmp', 'example.org'))
      .toEqual({
        'developmentServicesYaml': '/tmp/sites/development.services.yml',
        'settingsLocalPhp': '/tmp/sites/example.org/settings.local.php',
        'settingsPhp': '/tmp/sites/example.org/settings.php'
      });
  });
});

describe('File dependencies logic', () => {
  beforeEach(() => {
    // Mock install dir being found.
    fs.existsSync.mockReturnValue(true);
  });

  test('"Verify success" event emitted when ALL required file dependencies are provided', () => {
    const filePaths = {
      'developmentServicesYaml': '/development.services.yml',
      'settingsLocalPhp': '/settings.local.php',
      'settingsPhp': 'settings.php'
    }

    const handler = jest.fn()
    DevModeEvents.on('drupalFilePathsVerifySuccess', handler)

    drupalPaths.verifyDrupalFilePaths(filePaths)

    expect(handler).toBeCalledTimes(1)
    expect(handler).toBeCalledWith(filePaths)
  });

  test('"Verify failure" event emitted when SOME required file dependencies are provided', () => {
    const filePaths = {
      'developmentServicesYaml': '/development.services.yml',
      'settingsLocalPhp': null,
      'settingsPhp': null
    }

    const handler = jest.fn()
    DevModeEvents.on('drupalFilePathsVerifyFailure', handler)

    drupalPaths.verifyDrupalFilePaths(filePaths)

    expect(handler).toBeCalledTimes(1)
    expect(handler).toBeCalledWith(filePaths)
  });

  test('"Verify failure" event emitted when NO required file dependencies are provided', () => {
    const filePaths = {
      'developmentServicesYaml': null,
      'settingsLocalPhp': null,
      'settingsPhp': null
    }

    const handler = jest.fn()
    DevModeEvents.on('drupalFilePathsVerifyFailure', handler)

    drupalPaths.verifyDrupalFilePaths(filePaths)

    expect(handler).toBeCalledTimes(1)
    expect(handler).toBeCalledWith(filePaths)
  });
});
