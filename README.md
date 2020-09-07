# `drupal-dev-mode` package

This is an attempt to be able to quickly toggle on/off Drupal 8's 'dev mode',
with one command.

'dev mode' consists of:

- enabling inclusion of a `settings.local.php` file into the (default) Drupal
site's `settings.php` file (see "Pre-requisites" below)
- enabling Twig debugging in `development.services.yml` (which is enabled by
inclusion of `settings.local.php` in `settings.php`)
- enabling inclusion of Drupal cache related settings (`render`, `page` and
`dynamic_page_cache`) to nullify caches in `settings.local.php`

This package provides a CLI command, `toggle-dev-mode` that
achieves the points listed above. Running the command once will toggle 'dev
mode' on. Running it a second time will toggle 'dev mode' off again.

## Pre-requisites

- You will need to have already created `settings.local.php` (from the out of
the box example) and moved to the `default` site directory. This package does
not attempt to create that file, only modify it.

  Running `toggle-dev-mode` without `settings.local.php` may leave the site in
an unstable state!

- This package should be installed in a `node_modules` folder that is a
sibling of the Drupal install. The package assumes this location when trying
to find the various files to modify when running `toggle-dev-mode`.

## Manually running the `toggle-dev-mode` script

You can run the script idrectly with:

    node node_modules/drupal-dev-mode/cli.js

