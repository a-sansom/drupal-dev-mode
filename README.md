# `drupal-dev-mode` package

This is an attempt to be able to quickly toggle on/off Drupal 8's 'dev mode',
with one command.

The command/scripts here were written to run in the context of a Drupal site
running in a local Lando/Docker setup (see "[Prerequisites](#prerequisites)"
section below).

'dev mode' consists of:

- enabling inclusion of a `settings.local.php` file into the (default) Drupal
site's `settings.php` file (again, see "[Prerequisites](#prerequisites)"
below)
- enabling Twig debugging in `development.services.yml` (which is enabled by
inclusion of `settings.local.php` in `settings.php`)
- enabling inclusion of Drupal cache related settings (`render`, `page` and
`dynamic_page_cache`) to nullify caches in `settings.local.php`

This package provides a CLI command, `toggle-dev-mode` that
achieves the points listed above. Running the command once will toggle 'dev
mode' on. Running it a second time will toggle 'dev mode' off again.

## Prerequisites

- You will have a Drupal 8 site running locally via Lando. The Drupal install
dir will be `docroot`, `web` or `drupal`.

- You will need to have already created `settings.local.php` (from the out of
the box example) and moved to the `default` site directory. This package does
not (yet) attempt to create that file, only modify it.

- This package should be installed in a `node_modules` folder that is a
sibling of the Drupal install (Eg. a sibling of `docroot`, `web` or `drupal`).

  This should just be `npm install drupal-dev-mode`.

  The package assumes this location when trying to find the various files to
modify when running `toggle-dev-mode`.

## Running the `toggle-dev-mode` command/script

This should just be as simple as:

    npx toggle-dev-mode

You can also run the script directly with:

    node node_modules/drupal-dev-mode/cli.js

Output from running the command should be similar to:

    ~/W/xxx> npx toggle-dev-mode
    ┌─────────┬────────────────────────────────────────────────────────────────────────────────┐
    │ (index) │                                    Message                                     │
    ├─────────┼────────────────────────────────────────────────────────────────────────────────┤
    │    0    │                             'Building twig.config'                             │
    │    1    │  'Updated /Users/alex/Work/xxx/docroot/sites/development.services.yml'         │
    │    2    │                    'Enabling settings.local.php inclusion'                     │
    │    3    │    'Updated /Users/alex/Work/xxx/docroot/sites/default/settings.php'           │
    │    4    │              "Uncommenting $settings['cache']['bins']['render']"               │
    │    5    │               "Uncommenting $settings['cache']['bins']['page']"                │
    │    6    │        "Uncommenting $settings['cache']['bins']['dynamic_page_cache']"         │
    │    7    │ 'Updated /Users/alex/Work/xxx/docroot/sites/default/settings.local.php'        │
    └─────────┴────────────────────────────────────────────────────────────────────────────────┘

You will still want to run a `drush cache:rebuild` (or `drush cr`) after
running, to ensure changes take effect.

## Running package tests

There are a number of `Jest` tests included for the package/the packages
separate modules. They can be run (once devDependencies are installed) all
together, with:

    npm run test

Or on a per module basis. for example:

    npm run test settingsLocal.test.js
