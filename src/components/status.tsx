import * as React from 'react';
import { ISignal } from '@lumino/signaling';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { GroupItem, TextItem } from '@jupyterlab/statusbar';
import { TranslationBundle } from '@jupyterlab/translation';
import { IVoiceControlStatus } from '../types';
import { recognitionEnabledIcon, recognitionDisabledIcon } from '../icons';
import { VoiceController } from '../controller';

export class VoiceControlStatusIndicator extends ReactWidget {
  constructor(
    protected signal: ISignal<VoiceController, IVoiceControlStatus>,
    protected trans: TranslationBundle,
    protected controller: VoiceController
  ) {
    super();
  }

  render(): JSX.Element {
    return (
      <UseSignal<VoiceController, IVoiceControlStatus> signal={this.signal}>
        {(sender, status?: IVoiceControlStatus) => {
          if (!status) {
            status = {
              enabled: false
            };
          }
          const icon = status.enabled
            ? recognitionEnabledIcon
            : recognitionDisabledIcon;
          const text = this.trans.__(
            'Last voice recognition result: %1 with confidence %2',
            status.lastResult,
            status.lastConfidence
          );
          const shortText = this.trans.__(
            '%1 (%2%)',
            status.lastResult,
            status.lastConfidence
              ? Math.round(status.lastConfidence * 100)
              : '?'
          );
          const controller = this.controller;
          return (
            <GroupItem
              spacing={0}
              title={text}
              onClick={() => {
                controller.isEnabled
                  ? controller.disable()
                  : controller.enable();
              }}
            >
              <icon.react top={'2px'} kind={'statusBar'} />
              {status.error || status.lastResult ? (
                <TextItem
                  className={'status-message'}
                  source={status.error ? status.error : shortText}
                />
              ) : (
                <div></div>
              )}
            </GroupItem>
          );
        }}
      </UseSignal>
    );
  }
}
