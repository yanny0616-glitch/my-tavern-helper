import type { Macro } from '../ui/context';

export type MacroActionState = {
  mode: 'replace' | 'append';
  newline: boolean;
};

export type MacroActionContext = {
  macro: Macro;
  input: JQuery<HTMLTextAreaElement>;
  current: string;
  content: string;
  state: MacroActionState;
  replacement: string | null;
  setContent: (value: string) => void;
  setReplacement: (value: string) => void;
  setInputValue: (value: string) => void;
  clearInput: () => void;
};

export type MacroActionStrategy = {
  id: string;
  prepare?: (ctx: MacroActionContext) => void;
  afterApply?: (ctx: MacroActionContext) => Promise<void>;
};

function clickSendButton(): boolean {
  const $button = $('#send_but, #send_button, #send').first();
  if ($button.length) {
    $button.trigger('click');
    return true;
  }
  toastr.warning('未找到发送按钮，请手动发送。');
  return false;
}

export function buildMacroReplacement(ctx: MacroActionContext): string {
  const content = ctx.content;
  if (ctx.state.mode === 'append') {
    const prefix = ctx.current && ctx.state.newline ? '\n' : '';
    return `${ctx.current}${prefix}${content}`;
  }
  return `${content}${ctx.state.newline ? '\n' : ''}`;
}

export const macroActionStrategies: MacroActionStrategy[] = [
  {
    id: 'append',
    prepare: ctx => {
      ctx.state.mode = ctx.macro.send ? 'replace' : ctx.macro.append ? 'append' : 'replace';
    },
  },
  {
    id: 'newline',
    prepare: ctx => {
      ctx.state.newline = ctx.macro.newline;
    },
  },
  {
    id: 'send',
    afterApply: async ctx => {
      if (!ctx.macro.send) {
        return;
      }
      const replacement = ctx.replacement ?? '';
      if (!replacement.trim()) {
        toastr.warning('快捷语句为空，未发送。');
        return;
      }
      ctx.setInputValue(replacement);
      SillyTavern.activateSendButtons?.();
      setTimeout(() => {
        const clicked = clickSendButton();
        if (clicked) {
          setTimeout(() => ctx.clearInput(), 300);
        }
      }, 0);
    },
  },
];

export async function runMacroActionPipeline(
  ctx: MacroActionContext,
  strategies: MacroActionStrategy[] = macroActionStrategies,
) {
  strategies.forEach(strategy => strategy.prepare?.(ctx));
  if (ctx.replacement === null) {
    ctx.setReplacement(buildMacroReplacement(ctx));
  }
  const replacement = ctx.replacement ?? '';
  ctx.setInputValue(replacement);

  for (const strategy of strategies) {
    if (strategy.afterApply) {
      await strategy.afterApply(ctx);
    }
  }
}
