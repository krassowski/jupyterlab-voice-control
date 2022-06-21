import type { PartialJSONObject } from '@lumino/coreutils';

export interface IVoiceControlStatus {
  enabled: boolean;
  lastResult?: string;
  lastConfidence?: number;
  error?: string;
}

export interface IVoiceCommand {
  /**
   * Trigger phrase, can be a regular expresion with named capturing groups.
   */
  phrase: string;
  /**
   * Jupyter command ID.
   */
  command: string;
  /**
   * Arguments passed to the command, will be merged with any captured groups.
   */
  arguments?: PartialJSONObject;
}
