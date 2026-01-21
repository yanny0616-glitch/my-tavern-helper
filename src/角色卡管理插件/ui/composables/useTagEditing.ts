import { nextTick, ref } from 'vue';
import type { CardHubItem } from '../../types';

type TagEditingOptions = {
  getTags: (card: CardHubItem) => string[];
  applyTagUpdate: (card: CardHubItem, tags: string[]) => void;
};

export function useTagEditing(options: TagEditingOptions) {
  const activeTagKey = ref<string | null>(null);
  const tagInput = ref('');

  function tagKey(character: CardHubItem): string {
    return character.id;
  }

  function startTagEdit(character: CardHubItem) {
    activeTagKey.value = tagKey(character);
    tagInput.value = '';
    nextTick(() => {
      const input = document.querySelector<HTMLInputElement>('.cardhub-tag-input');
      input?.focus();
    });
  }

  function cancelTagEdit() {
    activeTagKey.value = null;
    tagInput.value = '';
  }

  function confirmTag(character: CardHubItem) {
    if (activeTagKey.value !== tagKey(character)) {
      return;
    }
    const input = tagInput.value.trim();
    if (input) {
      const nextTags = [...options.getTags(character), input];
      options.applyTagUpdate(character, nextTags);
    }
    cancelTagEdit();
  }

  function removeTag(character: CardHubItem, tag: string) {
    const nextTags = options.getTags(character).filter(item => item !== tag);
    options.applyTagUpdate(character, nextTags);
  }

  return {
    tagKey,
    activeTagKey,
    tagInput,
    startTagEdit,
    cancelTagEdit,
    confirmTag,
    removeTag,
  };
}
