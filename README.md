# jupyterlab-voice-control

[![Github Actions Status](https://github.com/krassowski/jupyterlab-voice-control/workflows/Build/badge.svg)](https://github.com/krassowski/jupyterlab-voice-control/actions/workflows/build.yml)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/krassowski/jupyterlab-voice-control/main?urlpath=lab)
[![PyPI version](https://img.shields.io/pypi/v/jupyterlab-voice-control.svg)](https://pypi.org/project/jupyterlab-voice-control/)

⚠️ **This extension is experimental** ⚠️

Voice commands for JupyterLab extension relies on experimental Speech Recognition API and is not suitable for use in production environments. You can check the current support on [caniuse.com/speech-recognition](https://caniuse.com/speech-recognition).

Please be aware that the Speech Recognition method is an implementation detail of the browser,
and some browsers, including Google Chrome, may send recordings of your voice to cloud for recognition.

While it is currently just proof of concept, please do get in touch by opening a new issue if you found this extension
useful/promising and would like to leave any feedback which would be greatly appreciated.

### Usage

To use this extension look for a microphone (![microphone icon][enabled]) icon on the status bar.

![Initial icon location in the status bar][recognition-disabled]

Press the disabled microphone icon (![disabled microphone icon][disabled]) to start voice recognition (or use <kbd>Alt</kbd> + <kbd>v</kbd> shortcut). You will need to agree for the browser to use your microphone:

![Microphone access dialog in Chrome][chrome-microphone]

You can use any of the commands available in the [command palette](https://jupyterlab.readthedocs.io/en/latest/user/commands.html), for example try "Download" or "Run selected cells".

Sometimes the speech recognition may be inaccurate, or you may misremember the name of the command.
In those cases the voice control assistant will prompt you with suggestions with words
"Did you mean..." and one or more suggestions on the status bar:

![Suggestion saying "Did you mean New Launcher?"][did-you-mean]

- You can accept the first suggestion by saying "yes".
- To choose the second suggestion say "second suggestion", and so on.
- Speech synthesis option is available (in the settings) if you prefer it over checking the status bar continuously.
- The threshold for inclusion of a similar-sounding phrase as a suggestion can be adjusted in the settings.

If there are no errors or suggestions, the recognised speech will be shown on the status bar together with a confidence estimate:

![Recognised phrase "close all tabs" with 87% confidence][recognised]

By default commands recognised with low confidence (<50%) will not be executed (as it is deemed safer in case of any potentially destructive actions), but you can change the threshold in the settings.

### Creating custom commands

In the settings editor you can assign custom phrases to commands in the same way as you can configure shortcuts.
We refer to the words you need to say in order to execute a command as _trigger phrase_.

The voice control extension provides additional commands for interaction with the interface such as typing text (`vc:insert-text`), accepting suggestions (`vc:accept-suggestion`), stopping recognition (`vc:stop-listening`), etc.

The trigger phrase can be a regular expression and include [_named capturing groups_](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match#using_named_capturing_groups). The captured groups will be passed as arguments to the command (/merged with pre-specified arguments if any, with groups overriding pre-specified arguments in case of a collision). For example, to create a command for opening files we could specify:

```json
{
  "phrase": "^open file (?<path>.*)",
  "command": "filebrowser:open-path"
}
```

`^` ensures that only phrases starting with "open file" will be matched.

We provide command `vc:open-notebook` (by default under `open notebook (?<path>.*)`) which automatically
appends notebook file extension (`.ipynb`) as it can be problematic for speech recognition software.

[enabled]: https://raw.githubusercontent.com/krassowski/jupyterlab-voice-control/main/style/icons/microphone.svg?sanitize=true
[disabled]: https://raw.githubusercontent.com/krassowski/jupyterlab-voice-control/main/style/icons/microphone-off.svg?sanitize=true
[chrome-microphone]: https://raw.githubusercontent.com/krassowski/jupyterlab-voice-control/main/docs/images/chrome-microphone.png
[recognition-disabled]: https://raw.githubusercontent.com/krassowski/jupyterlab-voice-control/main/docs/images/recognition-disabled.png
[recognised]: https://raw.githubusercontent.com/krassowski/jupyterlab-voice-control/main/docs/images/recognised.png
[did-you-mean]: https://raw.githubusercontent.com/krassowski/jupyterlab-voice-control/main/docs/images/did-you-mean.png

## Requirements

- JupyterLab >= 3.4 (may work with older versions of 3.x, but not tested)

## Install

To install the extension, execute:

```bash
pip install jupyterlab-voice-control
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab-voice-control
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab-voice-control directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall jupyterlab-voice-control
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab-voice-control` within that folder.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
