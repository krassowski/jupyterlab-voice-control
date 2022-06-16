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

export function typeText(options: ITypeOptions) {
  if (typeof options.text === 'undefined') {
    return 'No text provided';
  }
  const focused = document.activeElement;
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
  what?: 'last word';
}

export function deleteText(options: IDeleteText) {
  if (typeof options.what === 'undefined') {
    return 'No "what" argument provided';
  }
  const focused = document.activeElement;
  if (!focused) {
    return 'Cannot delete: no element is focused';
  }
  if (typeof (focused as any).value !== 'undefined') {
    const value = (focused as any).value;
    const lastSpace = value.lastIndexOf(' ');
    (focused as any).value = value.substring(0, lastSpace);
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
