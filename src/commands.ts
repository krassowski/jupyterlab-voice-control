import { Widget } from '@lumino/widgets';
import { NotebookPanel } from '@jupyterlab/notebook';
import { CodeEditor } from '@jupyterlab/codeeditor';

interface ITypeOptions {
  text?: string;
}

interface ICursorMove {
  to?: 'start' | 'end'; // | 'line start' | 'line end'
}

export function moveCursor(options: ICursorMove) {
  const focused = document.activeElement;
  if (!focused) {
    return 'Cannot move cursor: no element is focused';
  }
  if (typeof (focused as any).value !== 'undefined') {
    const input = focused as HTMLTextAreaElement | HTMLInputElement;
    if (options.to === 'start') {
      input.setSelectionRange(0, 0);
      input.focus();
    }
    if (options.to === 'end') {
      const end = input.value.length;
      input.setSelectionRange(end, end);
      input.focus();
    }
  }
}

function getEditor(widget: Widget | null): CodeEditor.IEditor | null {
  if (widget instanceof NotebookPanel) {
    const activeCell = widget.content.activeCell;
    if (activeCell) {
      return activeCell.editor;
    }
  } else if (typeof (widget as any).content.editor !== 'undefined') {
    return (widget as any).content.editor;
  } else if (typeof (widget as any).editor !== 'undefined') {
    return (widget as any).editor;
  }
  return null;
}

export function typeText(options: ITypeOptions, currentWidget: Widget | null) {
  if (typeof options.text === 'undefined') {
    return 'No text provided';
  }

  // Try to use Editor interface if current widget has it (and the editor has focus)
  const editor = getEditor(currentWidget);
  const focused = document.activeElement;

  if (editor && editor.hasFocus && editor.host.contains(focused)) {
    const cursor = editor.getCursorPosition();
    const offset = editor.getOffsetAt(cursor);
    editor.model.value.insert(offset, options.text);
    const updatedPosition = editor.getPositionAt(offset + options.text.length);
    if (updatedPosition) {
      editor.setCursorPosition(updatedPosition);
    }
    return;
  }

  if (!focused) {
    return 'Cannot type: no element is focused';
  }

  if (typeof (focused as any).value !== 'undefined') {
    (focused as any).value += options.text;
  } else {
    for (const key of options.text) {
      console.log(key.charCodeAt(0), key);
      focused.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: key,
          keyCode: key.charCodeAt(0),
          code: key,
          shiftKey: false,
          ctrlKey: false,
          metaKey: false,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          which: key.charCodeAt(0)
        })
      );
    }
  }
}

interface IDeleteText {
  what?: 'last word' | 'last line';
}

export function deleteText(options: IDeleteText, currentWidget: Widget | null) {
  if (typeof options.what === 'undefined') {
    return 'No "what" argument provided';
  }
  const deleteUntil = options.what === 'last word' ? ' ' : '\n';

  // Try to use Editor interface if current widget has it (and the editor has focus)
  const editor = getEditor(currentWidget);
  const focused = document.activeElement;

  if (editor && editor.hasFocus && editor.host.contains(focused)) {
    const cursor = editor.getCursorPosition();
    const offset = editor.getOffsetAt(cursor);
    const valueUpToCursor = editor.model.value.text.substring(0, offset);
    // TODO: use regular expressions to detect any number of white spaces?
    const lastSpace = valueUpToCursor.lastIndexOf(deleteUntil);
    const start = lastSpace === -1 ? 0 : lastSpace;
    editor.model.value.remove(start, offset);
    const updatedPosition = editor.getPositionAt(lastSpace);
    if (updatedPosition) {
      editor.setCursorPosition(updatedPosition);
    }
    return;
  }

  if (!focused) {
    return 'Cannot delete: no element is focused';
  }
  if (typeof (focused as any).value !== 'undefined') {
    const value = (focused as any).value;
    const lastSpace = value.lastIndexOf(deleteUntil);
    const end = lastSpace === -1 ? 0 : lastSpace;
    (focused as any).value = value.substring(0, end);
  }
}

interface IScrollByOptions {
  topPercent?: number;
  leftPercent?: number;
  behavior?: 'smooth' | 'auto';
}

export function scrollBy(options: IScrollByOptions) {
  const focused = document.activeElement;
  if (!focused) {
    return 'Cannot scroll: no element is focused';
  }
  if (options.behavior == null) {
    options.behavior = 'smooth';
  }
  focused.scrollBy({
    top: ((options.topPercent || 0) / 100) * window.innerHeight,
    left: ((options.leftPercent || 0) / 100) * window.innerWidth,
    behavior: options.behavior
  });
}
