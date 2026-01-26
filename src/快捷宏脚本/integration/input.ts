import type { Macro } from '../ui/context';
import type { MacroActionContext } from './macro-strategies';
import { runMacroActionPipeline } from './macro-strategies';

export function findInput(): JQuery<HTMLTextAreaElement> | null {
  const selectors = [
    '#send_textarea',
    '#sendTextArea',
    '#send-textarea',
    'textarea#send_textarea',
    'textarea#sendTextArea',
    'textarea#send-textarea',
    'textarea[name="send_textarea"]',
  ];

  for (const selector of selectors) {
    const $input = $(selector).first() as JQuery<HTMLTextAreaElement>;
    if ($input.length) {
      return $input;
    }
  }

  return null;
}

export async function applyMacro(macro: Macro) {
  const $input = findInput();
  if (!$input) {
    toastr.error('未找到输入框，无法插入快捷语句。');
    return;
  }

  const current = String($input.val() ?? '');
  const ctx: MacroActionContext = {
    macro,
    input: $input,
    current,
    content: macro.content,
    state: { mode: 'replace' as const, newline: true },
    replacement: null as string | null,
    setContent(value: string) {
      ctx.content = value;
    },
    setReplacement(value: string) {
      ctx.replacement = value;
    },
    setInputValue(value: string) {
      $input.val(value);
      $input.trigger('input');
      $input.trigger('change');
    },
    clearInput() {
      $input.val('');
      $input.trigger('input');
      $input.trigger('change');
    },
  };

  await runMacroActionPipeline(ctx);
  $input.trigger('focus');
}
