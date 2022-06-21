import { distance } from 'fastest-levenshtein';
import { CommandRegistry } from '@lumino/commands';

import { Signal } from '@lumino/signaling';
import { showErrorMessage, ICommandPalette } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';

import {
  IVoiceControlStatus,
  IVoiceCommand,
  IExecutableCommand
} from './types';

function normalise(text: string): string {
  return text.toLowerCase().trim();
}

interface IJupyterCommand {
  id: string;
  label: string;
  caption: string;
}

interface IAcceptOptions {
  option?: string;
}

interface ISuggestion {
  command: IExecutableCommand;
  score: number;
}

interface IMatchingResult {
  match?: IExecutableCommand;
  suggestions?: ISuggestion[];
  message?: string;
}

const ordinals: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5
};

export class VoiceController {
  statusChanged: Signal<VoiceController, IVoiceControlStatus>;
  private _status: IVoiceControlStatus;
  protected recognition: SpeechRecognition;
  protected confidenceThreshold: number;
  protected jupyterCommands: Map<string, IJupyterCommand>;
  protected speak = false;
  protected commands: Array<IVoiceCommand> = [];
  protected suggestionThreshold = 0.5;
  private counter = 0;
  private _currentSuggestions: ISuggestion[] = [];

  constructor(
    protected commandRegistry: CommandRegistry,
    protected trans: TranslationBundle,
    palette: ICommandPalette
  ) {
    this.statusChanged = new Signal(this);
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showErrorMessage(
        trans.__('Speech recognition not supported'),
        trans.__('Your browser does not support speech recognition.')
      );
      throw Error('Not supported');
    }
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.confidenceThreshold = 0;
    this._status = {
      enabled: false
    };
    this.jupyterCommands = new Map();
    this.recognition.onresult = this.handleSpeechResult.bind(this);

    this.recognition.onspeechend = event => {
      console.log('speech end');
      this.disable();
    };

    this.recognition.onerror = event => {
      const title = this.trans.__('Speech recognition not available');
      switch (event.error) {
        case 'audio-capture':
          showErrorMessage(title, this.trans.__('Microphone not detected'));
          break;
        case 'not-allowed':
          showErrorMessage(
            title,
            this.trans.__('Access to microphone was denied or blocked')
          );
          break;
        case 'no-speech':
          this._status.error = this.trans.__('No speech was detected');
          break;
      }
    };
    commandRegistry.commandChanged.connect(() => {
      this.updateGrammar();
    });
    this.updateGrammar();
  }

  matchPhrase(phrase: string): IMatchingResult {
    // First try to match against our voice commands which get a higher priority
    for (const command of this.commands) {
      const match = phrase.match(new RegExp(command.phrase, 'i'));
      if (match != null) {
        if (!this.commandRegistry.hasCommand(command.command)) {
          return {
            message: this.trans.__(
              'Matched "%1" phrase but command "%2" is not in the registry',
              command.phrase,
              command.command
            )
          };
        }
        const args = Object.assign({}, command.arguments);
        if (match.groups) {
          Object.assign(args, match.groups);
        }
        return {
          match: {
            id: command.command,
            label: command.phrase,
            arguments: args
          }
        };
      }
    }

    // If it did not succeed, match against all JupyterLab commands
    const command = this.jupyterCommands.get(phrase);
    if (command) {
      return {
        match: {
          id: command.id,
          label: command.label,
          arguments: {}
        }
      };
    } else {
      let best = Infinity;
      let bestCandidates: IJupyterCommand[] = [];
      for (const [candidateLabel, command] of this.jupyterCommands.entries()) {
        const matchScore = Math.min(
          distance(candidateLabel, phrase),
          distance(normalise(command.caption), phrase)
        );
        if (matchScore < best) {
          best = matchScore;
          bestCandidates = [command];
        } else if (matchScore === best) {
          bestCandidates.push(command);
        }
      }
      if (
        bestCandidates.length !== 0 &&
        best / phrase.length <= this.suggestionThreshold
      ) {
        const suggestionText = this.trans.__(
          'Did you mean %1?',
          bestCandidates.length === 1
            ? bestCandidates[0].label
            : bestCandidates
                .map((candidate, index) => `${index + 1}) ${candidate.label}`)
                .join(' or ')
        );
        const suggestions = bestCandidates.map(candidate => {
          return {
            command: {
              id: candidate.id,
              label: candidate.label
            },
            score: best
          };
        });

        return {
          message: suggestionText,
          suggestions: suggestions
        };
      }
    }
    return {};
  }

  communicate(message: string): void {
    this._status.error = message;
    if (this.speak) {
      speechSynthesis.speak(new SpeechSynthesisUtterance(message));
    }
  }

  handleSpeechResult(event: SpeechRecognitionEvent): void {
    const result = event.results[this.counter][0];
    const speech = normalise(result.transcript);
    this._status.lastResult = speech;
    this._status.lastConfidence = result.confidence;
    this.counter += 1;
    if (result.confidence < this.confidenceThreshold) {
      this.communicate(this.trans.__('Too low confidence. Speak up?'));
      this.statusChanged.emit(this._status);
      console.log('Discarding the result due to too low confidence');
      return;
    }
    this._status.error = undefined;
    this._status.executed = undefined;

    const matchResult = this.matchPhrase(speech);
    if (matchResult.match) {
      this.execute(matchResult.match);
    }
    if (matchResult.message) {
      this.communicate(matchResult.message);
    }
    this._currentSuggestions = matchResult.suggestions || [];
    this.statusChanged.emit(this._status);
  }

  execute(command: IExecutableCommand): void {
    this._status.executed = command;
    this.commandRegistry.execute(command.id, command.arguments);
  }

  acceptSuggestion(options: IAcceptOptions): void {
    const option = options.option != null ? ordinals[options.option] - 1 : 0;
    if (typeof option !== 'undefined') {
      if (this._currentSuggestions.length > option) {
        this.execute(this._currentSuggestions[option].command);
        this._currentSuggestions = [];
      } else {
        this.communicate(
          this.trans.__('Suggestion %1 not available.', option + 1)
        );
      }
    } else {
      console.warn('Could not resolve option to accept suggestion', options);
    }
  }

  set language(value: string) {
    this.recognition.lang = value;
  }

  updateGrammar(): void {
    this.jupyterCommands.clear();
    this.commandRegistry
      .listCommands()
      .filter(commandID => {
        try {
          return this.commandRegistry.isVisible(commandID);
        } catch (e) {
          // some commands require arguments to `isVisible` thus
          // we cannot know if they should be included or not,
          // but since users can specify custom trigger phrases
          // with appropriate arguments in settings, we do not
          // want to exclude those commands.
          return true;
        }
      })
      .map(commandID => {
        try {
          const label = this.commandRegistry.label(commandID);
          const caption = this.commandRegistry.caption(commandID);
          if (label) {
            this.jupyterCommands.set(normalise(label), {
              id: commandID,
              caption: caption,
              label: label
            });
          }
          return label;
        } catch (e) {
          return null;
        }
      })
      .filter(commandID => !!commandID);
  }

  get isEnabled(): boolean {
    return this._status.enabled;
  }

  configure(settings: ISettingRegistry.ISettings): void {
    // TODO
    this.language = 'en-US';
    this.speak = settings.composite.speak as boolean;
    this.confidenceThreshold = settings.composite.confidenceThreshold as number;
    this.suggestionThreshold = settings.composite.suggestionThreshold as number;
    this.commands = settings.composite.commands as unknown as IVoiceCommand[];
  }

  enable(): void {
    this._status.enabled = true;
    this.recognition.start();
    this.counter = 0;
    this.statusChanged.emit(this._status);
  }

  disable(): void {
    this._status.enabled = false;
    this.recognition.stop();
    this.statusChanged.emit(this._status);
  }
}
