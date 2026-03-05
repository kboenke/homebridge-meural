# Meural Canvas

[![License](https://img.shields.io/github/license/kboenke/homebridge-meural)](LICENSE)
[![Build and Lint](https://github.com/kboenke/homebridge-meural/actions/workflows/build.yml/badge.svg)](https://github.com/kboenke/homebridge-meural/actions/workflows/build.yml)

Control Meural canvases via HomeKit. Supports single or multiple canvases.

* Previous Photo ("swipe left") [via control center]
* Next Photo ("swipe right") [via control center]
* See info ("swipe up") [via control center]
* Navigate menus [via control center]
* Show Random (pick a random index from current device playlist; shows the same index across all devices if you have multiple canvases allowing you to create photo groups) [via Home app]
* Control brightness, on/off [via Home app]
* Automate on/off, brightness, and show random [via Home app]

Works with Canvas I, Canvas II, and Frame.

## Fork and compatibility notes

This repository is maintained as a fork of the original `homebridge-meural` plugin.

It exists to restore functionality after an authentication issue caused the original plugin to stop working.
A Pull Request has been submitted upstream to fix that authentication problem in the original repository: https://github.com/mikeknoop/homebridge-meural.

- Keep functional behavior close to upstream unless a fork-specific fix is required.
- Prefer compatibility updates that preserve existing user configuration.

Current runtime baseline for this fork:

- Homebridge: `>=1.8.0` (tested target: `1.11.x`)
- Node.js: `>=18.20.4` (tested target: Node `24.x`)

If you are upgrading from older releases, run:

1. `npm install`
2. `npm run build`
3. `npm audit`

Some deprecation warnings may still come from transitive dependencies in the Homebridge ecosystem and are not always fixable in this plugin alone.

## Installation

1. Add and fill out the following in your `config.json` in the `platforms` section:

```
{
    ...
    "platforms": [
        ...
        {
          "platform": "MeuralCanvas",
          "account_email": "", // for online https://my.meural.netgear.com/ account
          "account_password": "",
          "exclude_devices": ["5TS19578A01D8", ...] // optional, excludes a device in your account from appearing in HomeKit
        }
        ...
    ]
    ...
}
```

2. Install the plugin:

  - From npm: `sudo npm install -g homebridge-meural`
  - Directly from this fork (recommended while waiting for upstream auth fix): `sudo npm install -g github:kboenke/homebridge-meural`

## Install directly from this fork

You can install this plugin directly from GitHub without waiting for a new npm release:

`sudo npm install -g github:kboenke/homebridge-meural`

Then restart Homebridge.

## Version history

`0.9.8`:

* Fix slow handling of ActiveIdentifier callback bug

`0.9.7`:

* Publish Meurals as separate accessories so each has a dedicate remote in control center

`0.9.5`:

* Adds a new config option `exclude_devices` which takes an array of Meural serial numbers and excludes them from showing up in HomeKit

`0.9.4`:

* Increase the sync time for "show random" to 60s from 10s

`0.9.3`:

* Ungroups mulitple canvases to show them as separate devices now
* You can still sync "show random" across mulitple devices by putting all the devices in a single Home Scene

`0.9.0`:

* Initial release
* Adds support for Canvas (single or many) added as a single Television accessory

## Development

1. Install Homebridge
2. `npm link` (first time only, to link npm repo for your local dev environment)
3. `npm install`
4. `npm run watch`

This repo is written in TypeScript.

## License

MIT

## 3rd Party Licenses

See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
