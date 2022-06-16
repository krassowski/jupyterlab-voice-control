import { LabIcon } from '@jupyterlab/ui-components';
import microphone from '../style/icons/microphone.svg';
import microphoneOff from '../style/icons/microphone-off.svg';

export const recognitionEnabledIcon = new LabIcon({
  name: 'voice:enabled',
  svgstr: microphone
});

export const recognitionDisabledIcon = new LabIcon({
  name: 'voice:disabled',
  svgstr: microphoneOff
});
