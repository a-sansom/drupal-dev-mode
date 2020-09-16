const dme = require('./DevModeEvents.js')
const DevModeEvents = new dme.DevModeEvents()

const developmentServices = require('./developmentServices.js')(DevModeEvents);

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

describe('Toggling twig.debug settings behaviour', () => {
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
