const dme = require('./DevModeEvents.js')

describe('DevModeEvents class behaviour', () => {
  test('Test default state', () => {
    const received = new dme.DevModeEvents()

    expect(received.getFilePaths()).toEqual({})
    expect(received.getLog()).toEqual([])
  });

  test('Test filePaths', () => {
    const received = new dme.DevModeEvents()
    const filePaths = {
      'developmentServicesYaml': '/development.services.yml',
      "settingsPhp": '/settings.php',
      "settingsLocalPhp": '/settings.local.php'
    }
    received.setFilePaths(filePaths)

    expect(received.getFilePaths()).toEqual(filePaths)
  })

  test('Test log single message', () => {
    const received = new dme.DevModeEvents()
    received.addlog('This is a message')

    expect(received.getLog().length).toBe(1)
    expect(received.getLog()).toEqual(['This is a message'])
  });

  test('Test log multiple messages', () => {
    const received = new dme.DevModeEvents()
    received.addlogs([
      'First message',
      'Second message'
    ])

    expect(received.getLog().length).toBe(2)
    expect(received.getLog()).toEqual([
      'First message',
      'Second message'
    ])
  });

  test('Test log format for console.table()', () => {
    const received = new dme.DevModeEvents()
    received.addlogs([
      'First message',
      'Second message'
    ])
    const expected = [
      {'Message': 'First message'},
      {'Message': 'Second message'},
    ]

    expect(received.getLogForConsoleTable()).toEqual(expected)
  });
});