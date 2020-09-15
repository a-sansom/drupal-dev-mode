const drupalPaths = require('./drupalPaths.js');

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

// @todo In the 'refactor to use events' branch we isolate the code
// differently, by pulling the function code out to an event handler. We
// really should decide sooner rather than later if the events-based
// approach is preferable.
describe('File dependencies logic', () => {
  beforeEach(() => {
    // Mock install dir being found.
    fs.existsSync.mockReturnValue(true);
  });

  test('All required file dependencies are provided', () => {
    const filePaths = {
      'developmentServicesYaml': '/development.services.yml',
      'settingsLocalPhp': '/settings.local.php',
      'settingsPhp': 'settings.php'
    }

    expect(drupalPaths.fileDependenciesHaveBeenMet(filePaths)).toBe(true);
  });

  test('Some required file dependencies are provided', () => {
    const filePaths = {
      'developmentServicesYaml': '/development.services.yml',
      'settingsLocalPhp': null,
      'settingsPhp': null
    }

    expect(drupalPaths.fileDependenciesHaveBeenMet(filePaths)).toBe(false);
  });

  test('No required file dependencies are provided', () => {
    const filePaths = {
      'developmentServicesYaml': null,
      'settingsLocalPhp': null,
      'settingsPhp': null
    }

    expect(drupalPaths.fileDependenciesHaveBeenMet(filePaths)).toBe(false);
  });
});
