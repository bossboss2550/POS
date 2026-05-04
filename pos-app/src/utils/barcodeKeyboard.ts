const SHIFTED_SYMBOLS: Record<string, string> = {
  Backquote: "~",
  Minus: "_",
  Equal: "+",
  BracketLeft: "{",
  BracketRight: "}",
  Backslash: "|",
  Semicolon: ":",
  Quote: '"',
  Comma: "<",
  Period: ">",
  Slash: "?",
};

const DEFAULT_SYMBOLS: Record<string, string> = {
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Space: " ",
  NumpadAdd: "+",
  NumpadSubtract: "-",
  NumpadDecimal: ".",
  NumpadDivide: "/",
  NumpadMultiply: "*",
};

const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "tel",
  "url",
  "email",
  "password",
  "number",
]);

interface KeyboardLikeEvent {
  code: string;
  shiftKey?: boolean;
}

function setInputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value");

  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }

  element.dispatchEvent(new Event("input", { bubbles: true }));
}

export function getBarcodeCharacterFromEvent(event: KeyboardLikeEvent): string | null {
  const digitMatch = /^Digit([0-9])$/.exec(event.code);
  if (digitMatch) {
    return digitMatch[1];
  }

  const numpadDigitMatch = /^Numpad([0-9])$/.exec(event.code);
  if (numpadDigitMatch) {
    return numpadDigitMatch[1];
  }

  const letterMatch = /^Key([A-Z])$/.exec(event.code);
  if (letterMatch) {
    return letterMatch[1];
  }

  if (event.shiftKey && SHIFTED_SYMBOLS[event.code]) {
    return SHIFTED_SYMBOLS[event.code];
  }

  return DEFAULT_SYMBOLS[event.code] ?? null;
}

export function getEditableTextTarget(target: EventTarget | null): HTMLInputElement | HTMLTextAreaElement | null {
  if (target instanceof HTMLTextAreaElement) {
    return target;
  }

  if (target instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(target.type || "text")) {
    return target;
  }

  return null;
}

export function restoreEditableValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  setInputValue(element, value);

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const caret = value.length;
    element.setSelectionRange(caret, caret);
  }
}

export function insertBarcodeCharacter(
  element: HTMLInputElement | HTMLTextAreaElement,
  character: string,
  currentValue: string,
) {
  const selectionStart = element.selectionStart ?? currentValue.length;
  const selectionEnd = element.selectionEnd ?? selectionStart;
  const nextValue = `${currentValue.slice(0, selectionStart)}${character}${currentValue.slice(selectionEnd)}`;
  const nextCaret = selectionStart + character.length;

  setInputValue(element, nextValue);
  requestAnimationFrame(() => element.setSelectionRange(nextCaret, nextCaret));
}

export function normalizeBarcodeValue(value: string): string {
  return value.trim().toUpperCase();
}
