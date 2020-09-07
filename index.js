'use strict';

function drupalDevMode() {
  // If we 'npm require' this package and then, in script, we can:
  //
  //     const drupalDevMode = require('drupal-dev-mode')
  //
  // We're then able to call this function with drupalDevMode() to log the
  // message(s) below. We could eventually make it so that we're able to
  // call this function to programmatically toggle 'dev mode', if that were
  // seen as being useful (although it probably isn't).
  console.log("This package provides a CLI command, toggle-dev-mode, for toggling on/off Drupal 8's 'dev mode.'");
  console.log("Take a look at the package README.md and its pre-requisites.'");
}

module.exports = drupalDevMode