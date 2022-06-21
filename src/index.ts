import { JSONExt } from '@lumino/coreutils';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IStatusBar } from '@jupyterlab/statusbar';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { VoiceControlStatusIndicator } from './components/status';
import { VoiceController } from './controller';
import { scrollBy, typeText, moveCursor, deleteText } from './commands';

import { IVoiceCommand } from './types';

const PLUGIN_ID = 'jupyterlab-voice-control:plugin';

/**
 * Initialization data for the jupyterlab-voice-control extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ISettingRegistry, IStatusBar, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    settingRegistry: ISettingRegistry | null,
    statusBar: IStatusBar | null,
    translator: ITranslator | null
  ) => {
    console.log('JupyterLab extension jupyterlab-voice-control is activated!');

    translator = translator || nullTranslator;
    const trans = translator.load('jupyterlab-voice-control');

    const controller = new VoiceController(app.commands, trans, palette);

    let canonical: ISettingRegistry.ISchema | null;
    let configuredVoiceCommands: string[] = [];
    /**
     * Populate the plugin's schema defaults.
     */
    const populate = (schema: ISettingRegistry.ISchema) => {
      const commandsSchema = schema.properties!.commands;
      const defaultCommands = (
        commandsSchema.default as unknown as IVoiceCommand[]
      ).map(voiceCommand => voiceCommand.command);
      const availableCommands = new Set(app.commands.listCommands());
      const userCommands = configuredVoiceCommands.filter(
        x => !defaultCommands.includes(x)
      );
      const commandsUnion = new Set([
        ...availableCommands,
        ...userCommands,
        ...defaultCommands
      ]);
      console.log(userCommands);
      const unavailableUserCommands = userCommands.filter(
        x => !availableCommands.has(x)
      );
      if (unavailableUserCommands.length) {
        console.warn(
          'User commands',
          unavailableUserCommands,
          'provided for custom voice commands are not available in this installation of JupyterLab'
        );
      }
      const unavailableDefaultCommands = defaultCommands.filter(
        x => !availableCommands.has(x)
      );
      if (unavailableDefaultCommands.length) {
        console.warn(
          'Default commands',
          unavailableDefaultCommands,
          'are not available in this installation of JupyterLab'
        );
      }
      (
        commandsSchema.items! as ISettingRegistry.IProperty
      ).properties!.command.enum = [...commandsUnion];
    };

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          configuredVoiceCommands = (
            settings.composite.commands as unknown as IVoiceCommand[]
          ).map(voiceCommand => voiceCommand.command);
          settings.changed.connect(controller.configure.bind(controller));
          controller.configure(settings);
        })
        .catch(reason => {
          console.error(
            'Failed to load settings for jupyterlab-voice-control.',
            reason
          );
        });
      settingRegistry.transform(plugin.id, {
        fetch: plugin => {
          // Only override the canonical schema the first time.
          if (!canonical) {
            canonical = JSONExt.deepCopy(plugin.schema);
            populate(canonical);
          }
          return {
            data: plugin.data,
            id: plugin.id,
            raw: plugin.raw,
            schema: canonical,
            version: plugin.version
          };
        }
      });
    }

    if (statusBar) {
      statusBar.registerStatusItem(PLUGIN_ID, {
        item: new VoiceControlStatusIndicator(
          controller.statusChanged,
          trans,
          controller
        ),
        rank: 900
      });
    }

    app.commands.addCommand('vc:start-listening', {
      label: trans.__('Enable voice control'),
      execute: () => controller.enable(),
      isVisible: () => !controller.isEnabled
    });

    app.commands.addCommand('vc:stop-listening', {
      label: trans.__('Enable voice control'),
      execute: () => controller.enable(),
      isVisible: () => !controller.isEnabled
    });

    app.commands.addCommand('vc:scroll-by', {
      label: trans.__('Scroll Focused Element By'),
      execute: args => scrollBy(args)
    });

    app.commands.addCommand('vc:type-text', {
      label: trans.__('Type Text Into Focused Element'),
      execute: args => typeText(args, app.shell.currentWidget)
    });

    app.commands.addCommand('vc:delete-text', {
      label: trans.__('Delete Text From Focused Element'),
      execute: args => deleteText(args, app.shell.currentWidget)
    });

    app.commands.addCommand('vc:accept-suggestion', {
      label: trans.__('Accept Voice Control Suggestion'),
      execute: args => controller.acceptSuggestion(args)
    });

    app.commands.addCommand('vc:open-notebook', {
      label: trans.__('Open Notebook By Name'),
      execute: args =>
        app.commands.execute('filebrowser:open-path', {
          path: args.path + '.ipynb'
        })
    });

    app.commands.addCommand('vc:move-cursor', {
      label: trans.__('Move Cursor In Editor'),
      execute: args => moveCursor(args)
    });
  }
};

export default plugin;
