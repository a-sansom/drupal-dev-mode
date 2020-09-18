const dme = require('./DevModeEvents.js')
const DevModeEvents = new dme.DevModeEvents()

const developmentServices = require('./developmentServices.js')(DevModeEvents);

const fs = require('fs')
jest.mock('fs');

describe('Parsing developmentServices YAML data', () => {
  test('Test valid YAML data behaviour', (done) => {
    const validYamlData = `
parameters:
  http.response.debug_cacheability_headers: true
`

    function callback(err, data) {
      try {
        expect(err).toBeNull();
        expect(data).toHaveProperty(
          ['parameters', 'http.response.debug_cacheability_headers'],
          true
        )

        done();
      }
      catch (error) {
        done(error);
      }
    }

    developmentServices.getDevelopmentServicesAsYaml(validYamlData, callback)
  });

  test('Test invalid YAML data behaviour', (done) => {
    const invalidYamlData = `
THIS STRING WILL NOT BE ABLE TO BE PARSED AS YAML
parameters:
  http.response.debug_cacheability_headers: true
`

    function callback(err, data) {
      try {
        expect(err).not.toBeNull();
        expect(data).toEqual({});

        done();
      }
      catch (error) {
        done(error);
      }
    }

    developmentServices.getDevelopmentServicesAsYaml(invalidYamlData, callback)
  });
});

describe('Get data behaviour from valid YAML', () => {
  const yaml = {
    parameters: {
      'http.response.debug_cacheability_headers': true
    }
  }

  test('Test null returned from invalid (non-array) address', () => {
    const path = 'this is an invalid path to data'
    const received = developmentServices.getYamlValueFromPath(yaml, path)

    expect(received).toBeNull()
  });

  test('Test null returned from invalid (array) address', () => {
    const path = ['this', 'is', 'an', 'invalid', 'path', 'to', 'data']
    const received = developmentServices.getYamlValueFromPath(yaml, path)

    expect(received).toBeUndefined()
  });

  test('Test expected data returned for valid address', () => {
    const path = ['parameters', 'http.response.debug_cacheability_headers']
    const received = developmentServices.getYamlValueFromPath(yaml, path)

    expect(received).toBe(true)
  });
});

describe('Toggling twig.config settings behaviour', () => {
  test('Default (true) config is built', () => {
    const yaml = {
      parameters: {
        'twig.config': null
      }
    }
    const received = developmentServices.buildToggledTwigDebugConfig(yaml)
    const expected = {
      debug: true,
      auto_reload: true
    }

    expect(received).toEqual(expected)
  });

  test('Existing "true" config is toggled to "false"', () => {
    const yaml = {
      parameters: {
        'twig.config': {
          debug: true,
          auto_reload: true
        }
      }
    }
    const received = developmentServices.buildToggledTwigDebugConfig(yaml)
    const expected = {
      debug: false,
      auto_reload: false
    }

    expect(received).toEqual(expected)
  });

  test('Existing "false" config is toggled to "true"', () => {
    const yaml = {
      parameters: {
        'twig.config': {
          debug: false,
          auto_reload: false
        }
      }
    }
    const received = developmentServices.buildToggledTwigDebugConfig(yaml)
    const expected = {
      debug: true,
      auto_reload: true
    }

    expect(received).toEqual(expected)
  });
});

describe('Merging (new) twig.config settings into development.services.yml data', () => {
  test('Merging new data when no existing twig.config exists', () => {
    const yaml = {
      parameters: {}
    }
    const twigConfig = {
      debug: true,
      auto_reload: true
    }

    const received = developmentServices.mergeTwigConfigIntoDevelopmentServices(yaml, twigConfig)
    const expected = {
      parameters: {
        'twig.config': {
          debug: true,
          auto_reload: true
        }
      }
    }

    expect(received).toEqual(expected)
  });

  test('Merging new data when twig.config exists with same keys', () => {
    const yaml = {
      parameters: {
        'twig.config': {
          debug: false,
          auto_reload: false
        }
      }
    }
    const twigConfig = {
      debug: true,
      auto_reload: true
    }

    const received = developmentServices.mergeTwigConfigIntoDevelopmentServices(yaml, twigConfig)
    const expected = {
      parameters: {
        'twig.config': {
          debug: true,
          auto_reload: true
        }
      }
    }

    expect(received).toEqual(expected)
  });

  test('Merging new data when twig.config exists with other keys', () => {
    const yaml = {
      parameters: {
        'twig.config': {
          'preexisting': 'value'
        }
      }
    }
    const twigConfig = {
      debug: true,
      auto_reload: true
    }

    const received = developmentServices.mergeTwigConfigIntoDevelopmentServices(yaml, twigConfig)
    const expected = {
      parameters: {
        'twig.config': {
          'preexisting': 'value',
          debug: true,
          auto_reload: true
        }
      }
    }

    expect(received).toEqual(expected)
  });

  test('Merging new data when twig.config exists with same keys and others', () => {
    const yaml = {
      parameters: {
        'twig.config': {
          'preexisting': 'value',
          debug: false,
          auto_reload: false
        }
      }
    }
    const twigConfig = {
      debug: true,
      auto_reload: true
    }

    const received = developmentServices.mergeTwigConfigIntoDevelopmentServices(yaml, twigConfig)
    const expected = {
      parameters: {
        'twig.config': {
          'preexisting': 'value',
          debug: true,
          auto_reload: true
        }
      }
    }

    expect(received).toEqual(expected)
  });
});

describe('Test development.services.yml events', () => {
  test('Test developmentServicesReadFailure emitted', () => {
    fs.readFile.mockImplementation((filePath, options, callback) => {
      // Control what the callback (that is being passed to fs.readFile) gets
      // called with, so we can force the situation we want to test. We're
      // not interested in the 'filePath' and 'options' params to readFile,
      // just the callback and what we call it with.
      callback('Non-null value to force event to be emitted', {})
    })

    // Register an event handler that should be called when the readFile()
    // callback is called. Doesn't need to do anything, just be able to be
    // called and observed as having been called.
    const handler = jest.fn().mockName('developmentServicesReadFailureHandler')
    DevModeEvents.on('developmentServicesReadFailure', handler)

    // Call the method that will call fs.readFile(), which our
    // mockImplementation() will intercept and call the call back with the
    // parameters we want to test the outcome of.
    developmentServices.toggleTwigDebugConfig('/development.services.yml')

    // Check that the event handler got called, as expected.
    expect(handler).toBeCalledTimes(1)
  });

  //test('Test developmentServicesParseYamlFailure emitted', () => {
  //});

  test('Test developmentServicesWriteFailure emitted', () => {
    fs.writeFile.mockImplementation((filePath, config, callback) => {
      // Control what the callback (that is being passed to fs.writeFile) gets
      // called with, so we can force the situation we want to test. We're not
      // interested in the 'filePath' and 'config' params to writeFile, just
      // the callback and what we call it with.
      callback('Non-null value to force event to be emitted')
    })

    // Register event handlers to be called (or not) when the writeFile()
    // callback is called. Doesn't need to do anything, just be able to be
    // called and observed as having been called.
    const failureHandler = jest.fn().mockName('failureHandler')
    const successHandler = jest.fn().mockName('successHandler')
    DevModeEvents.on('developmentServicesWriteFailure', failureHandler)
    DevModeEvents.on('developmentServicesWritten', successHandler)

    // Call the method that will call fs.writeFile(), which our
    // mockImplementation() will intercept and call the call back with the
    // parameters we want to test the outcome of.
    developmentServices.writeDevelopmentServicesYaml('/development.services.yml', {})

    // Check that the event handlers were called (or not), as expected.
    expect(failureHandler).toBeCalledTimes(1)
    expect(successHandler).toBeCalledTimes(0)
  });

  test('Test developmentServicesWritten emitted', () => {
    fs.writeFile.mockImplementation((filePath, config, callback) => {
      // Null representing 'no error'.
      callback(null)
    })

    const failureHandler = jest.fn().mockName('failureHandler')
    const successHandler = jest.fn().mockName('successHandler')
    DevModeEvents.on('developmentServicesWriteFailure', failureHandler)
    DevModeEvents.on('developmentServicesWritten', successHandler)

    developmentServices.writeDevelopmentServicesYaml('/development.services.yml', {})

    expect(failureHandler).toBeCalledTimes(0)
    expect(successHandler).toBeCalledTimes(1)
  });
});
