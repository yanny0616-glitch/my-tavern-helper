<template>
  <div class="cardhub-root" :class="{ open: state.open }" :style="themeStyle">
    <div class="cardhub-backdrop" @click="close" />
    <section class="cardhub-panel" role="dialog" aria-label="CardHub 角色卡管理器">
      <header class="cardhub-header">
        <div class="cardhub-title">
          <span class="cardhub-title__main">CardHub</span>
          <span class="cardhub-title__sub">角色卡管理器</span>
        </div>
        <div class="cardhub-actions">
          <button class="cardhub-theme-trigger" type="button" aria-label="配色" @click="openThemeDialog">
            <i class="fa-solid fa-palette" aria-hidden="true"></i>
          </button>
          <button class="cardhub-settings-trigger" type="button" aria-label="设置" @click="openSettingsDialog">
            <i class="fa-solid fa-gear" aria-hidden="true"></i>
          </button>
          <button class="cardhub-close" type="button" aria-label="关闭" @click="close">
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </header>

      <div class="cardhub-toolbar">
        <input v-model="state.search" class="cardhub-search" type="search" placeholder="搜索角色名或标签" />
        <button class="cardhub-button" type="button" @click="refresh">刷新</button>
        <button class="cardhub-button is-ghost" type="button" @click="triggerImport">导入</button>
        <button class="cardhub-button is-ghost" type="button" @click="exportSelected">批量导出</button>
        <input
          ref="importInput"
          class="cardhub-import-input"
          type="file"
          accept=".png,.json"
          multiple
          @change="handleImportFiles"
        />
      </div>

      <div class="cardhub-body">
        <div class="cardhub-sidebar">
          <div class="cardhub-filter-row">
            <div class="cardhub-filter-block">
              <div class="cardhub-section-title">分类</div>
              <div class="cardhub-chip-row">
                <button
                  class="cardhub-chip"
                  :class="{ 'is-active': statusFilter === 'all' }"
                  type="button"
                  @click="statusFilter = 'all'"
                >
                  全部
                </button>
                <button
                  class="cardhub-chip"
                  :class="{ 'is-active': statusFilter === 'imported' }"
                  type="button"
                  @click="statusFilter = 'imported'"
                >
                  已导入
                </button>
                <button
                  class="cardhub-chip"
                  :class="{ 'is-active': statusFilter === 'unimported' }"
                  type="button"
                  @click="statusFilter = 'unimported'"
                >
                  未导入
                </button>
                <button
                  class="cardhub-chip"
                  :class="{ 'is-active': statusFilter === 'duplicate' }"
                  type="button"
                  @click="statusFilter = 'duplicate'"
                >
                  重复
                </button>
                <button
                  class="cardhub-chip"
                  :class="{ 'is-active': favoritesOnly }"
                  type="button"
                  @click="favoritesOnly = !favoritesOnly"
                >
                  收藏
                </button>
              </div>
            </div>
            <div class="cardhub-filter-block">
              <div class="cardhub-section-title">排序</div>
              <div class="cardhub-chip-row">
                <button
                  class="cardhub-chip"
                  :class="{ 'is-active': sortKey === 'recent' }"
                  type="button"
                  @click="sortKey = 'recent'"
                >
                  最近聊天
                </button>
                <button
                  class="cardhub-chip"
                  :class="{ 'is-active': sortKey === 'name' }"
                  type="button"
                  @click="sortKey = 'name'"
                >
                  名称
                </button>
                <button
                  class="cardhub-chip"
                  :class="{ 'is-active': sortKey === 'tags' }"
                  type="button"
                  @click="sortKey = 'tags'"
                >
                  标签数量
                </button>
                <button
                  class="cardhub-chip"
                  :class="{ 'is-active': sortKey === 'imported' }"
                  type="button"
                  @click="sortKey = 'imported'"
                >
                  导入时间
                </button>
              </div>
            </div>
          </div>
          <div class="cardhub-divider" />
          <div class="cardhub-section-title">标签</div>
          <div class="cardhub-tag-filter">
            <button
              v-for="tag in allTags"
              :key="tag"
              class="cardhub-tag-filter__chip"
              :class="{ 'is-active': selectedTags.includes(tag) }"
              type="button"
              @click="toggleTagFilter(tag)"
            >
              {{ tag }}
            </button>
          </div>
          <button
            v-if="selectedTags.length"
            class="cardhub-chip cardhub-chip--clear"
            type="button"
            @click="clearTagFilter"
          >
            清空标签
          </button>
          <button class="cardhub-chip cardhub-chip--more" type="button" @click="openTagManager('filter')">
            标签管理
          </button>
        </div>

        <div class="cardhub-content">
          <div v-if="state.loading" class="cardhub-loading">正在读取角色卡...</div>
          <div v-else-if="!filteredCharacters.length" class="cardhub-empty">暂无角色卡，或没有匹配的搜索结果。</div>
          <div v-else class="cardhub-grid-wrap">
            <div class="cardhub-pagination">
              <div v-if="totalPages > 1" class="cardhub-pagination__actions">
                <button class="cardhub-pagination__button" type="button" :disabled="currentPage <= 1" @click="prevPage">
                  上一页
                </button>
                <button
                  class="cardhub-pagination__button"
                  type="button"
                  :disabled="currentPage >= totalPages"
                  @click="nextPage"
                >
                  下一页
                </button>
              </div>
              <span class="cardhub-pagination__status">第 {{ currentPage }} / {{ totalPages }} 页</span>
            </div>
            <div class="cardhub-grid">
              <article
                v-for="character in pagedCharacters"
                :key="character.id"
                class="cardhub-card"
                :class="{ 'is-duplicate': duplicateIdSet.has(character.id) }"
                @click="openManage(character)"
              >
                <div
                  class="cardhub-card__avatar"
                  :class="{ 'has-avatar': Boolean(avatarUrl(character)) }"
                  :style="avatarStyle(character)"
                >
                  <span>{{ character.name.slice(0, 1) || '?' }}</span>
                </div>
                <div class="cardhub-card__info">
                  <div class="cardhub-card__head">
                    <div class="cardhub-card__name">{{ character.name }}</div>
                    <button
                      class="cardhub-fav"
                      :class="{ 'is-active': isFavorite(character.id) }"
                      type="button"
                      aria-label="收藏"
                      @click.stop="toggleFavorite(character)"
                    >
                      <i class="fa-solid fa-star" aria-hidden="true"></i>
                    </button>
                  </div>
                  <div class="cardhub-card__meta">
                    <span>{{ character.origin === 'tavern' ? '已导入' : '未导入' }}</span>
                    <span>{{ displayTags(character).length }} 标签</span>
                  </div>
                  <div v-if="showNoteSummary && displayNote(character)" class="cardhub-card__note">
                    {{ displayNote(character) }}
                  </div>
                  <div class="cardhub-card__tags">
                    <button
                      v-for="tag in displayTags(character)"
                      :key="tag"
                      class="cardhub-tag"
                      type="button"
                      title="点击移除标签"
                      @click.stop="removeTag(character, tag)"
                    >
                      {{ tag }}
                      <span class="cardhub-tag__remove">×</span>
                    </button>
                    <button
                      v-if="activeTagKey !== tagKey(character)"
                      class="cardhub-tag is-add"
                      type="button"
                      @click.stop="startTagEdit(character)"
                    >
                      + 标签
                    </button>
                    <div v-else class="cardhub-tag-edit" @click.stop @mousedown.stop @touchstart.stop>
                      <input
                        v-model="tagInput"
                        class="cardhub-tag-input"
                        type="text"
                        placeholder="新标签"
                        @keydown.enter.prevent="confirmTag(character)"
                        @keydown.esc.prevent="cancelTagEdit"
                        @blur="confirmTag(character)"
                      />
                      <button class="cardhub-tag-confirm" type="button" @click="confirmTag(character)">✔</button>
                    </div>
                  </div>
                </div>
                <div class="cardhub-card__actions">
                  <button
                    class="cardhub-card__action is-secondary"
                    type="button"
                    @click.stop="handleCardAction(character)"
                    @pointerdown.stop
                    @mousedown.stop
                    @touchstart.stop
                  >
                    {{ character.origin === 'tavern' ? '导出' : '导入' }}
                  </button>
                  <button
                    class="cardhub-card__action"
                    type="button"
                    @click.stop="openManage(character)"
                    @pointerdown.stop
                    @mousedown.stop
                    @touchstart.stop
                  >
                    管理
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>

    <ManageModal
      :card="manageCard"
      :display-tags="displayTags"
      :handle-card-action="handleCardAction"
      :manage-delete="manageDelete"
      :close-manage="closeManage"
      :close-root="close"
      :apply-note-update="applyNoteUpdate"
      :parse-library-card-data="parseLibraryCardData"
      :update-last-chat-cache-for-card="updateLastChatCacheForCard"
    />

    <div v-if="confirmState.open" class="cardhub-confirm cardhub-modal" @click.self="resolveConfirm('cancel')">
      <div class="cardhub-confirm__panel cardhub-modal__panel" role="dialog" aria-modal="true">
        <div class="cardhub-confirm__title">{{ confirmState.title }}</div>
        <div class="cardhub-confirm__message">{{ confirmState.message }}</div>
        <div class="cardhub-confirm__actions">
          <button class="cardhub-confirm__button is-cancel" type="button" @click="resolveConfirm('cancel')">
            {{ confirmState.cancelLabel }}
          </button>
          <button
            v-if="confirmState.altLabel"
            class="cardhub-confirm__button is-danger"
            type="button"
            @click="resolveConfirm('alt')"
          >
            {{ confirmState.altLabel }}
          </button>
          <button class="cardhub-confirm__button is-confirm" type="button" @click="resolveConfirm('confirm')">
            {{ confirmState.confirmLabel }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="tagManagerOpen" class="cardhub-tag-manager cardhub-modal" @click.self="closeTagManager">
      <div class="cardhub-tag-manager__panel cardhub-modal__panel" role="dialog" aria-label="标签管理">
        <div class="cardhub-tag-manager__header">
          <div>
            <div class="cardhub-tag-manager__title">标签管理</div>
            <div v-if="tagManagerTab === 'filter'" class="cardhub-tag-manager__subtitle">
              已选 {{ selectedTags.length }} / {{ allTags.length }}
            </div>
            <div v-else class="cardhub-tag-manager__subtitle">
              已选 {{ batchTagSelectedIds.length }} / {{ batchTagVisibleCandidates.length }}
            </div>
          </div>
          <button class="cardhub-preview__close" type="button" @click="closeTagManager">×</button>
        </div>
        <div class="cardhub-tag-manager__tabs">
          <button
            class="cardhub-tag-manager__tab"
            :class="{ 'is-active': tagManagerTab === 'filter' }"
            type="button"
            @click="openTagManager('filter')"
          >
            标签筛选
          </button>
          <button
            class="cardhub-tag-manager__tab"
            :class="{ 'is-active': tagManagerTab === 'batch' }"
            type="button"
            @click="openTagManager('batch')"
          >
            批量标签
          </button>
        </div>
        <div v-if="tagManagerTab === 'filter'" class="cardhub-tag-manager__section">
          <div class="cardhub-tag-manager__actions">
            <button
              class="cardhub-tag-manager__btn is-secondary"
              type="button"
              :disabled="!selectedTags.length"
              @click="clearTagFilter"
            >
              清空
            </button>
            <div class="cardhub-tag-manager__spacer"></div>
            <button class="cardhub-tag-manager__btn is-primary" type="button" @click="closeTagManager">完成</button>
          </div>
          <div class="cardhub-tag-manager__list">
            <button
              v-for="tag in allTags"
              :key="tag"
              class="cardhub-tag-manager__chip"
              :class="{ 'is-active': selectedTags.includes(tag) }"
              type="button"
              @click="toggleTagFilter(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>
        <div v-else class="cardhub-tag-manager__section cardhub-tag-manager__batch">
          <div class="cardhub-batch__filters">
            <input
              v-model="batchTagSearch"
              class="cardhub-batch__search"
              type="search"
              placeholder="搜索角色名或标签"
            />
            <div class="cardhub-batch__hint">提示：可先在主界面筛选，再切换到批量标签。</div>
          </div>
          <div class="cardhub-batch__field">
            <input v-model="batchTagInput" type="text" placeholder="输入标签，逗号/换行分隔" />
          </div>
          <div v-if="batchTagSuggestions.length" class="cardhub-batch__suggestions">
            <span class="cardhub-batch__suggest-title">已有标签</span>
            <div class="cardhub-batch__suggest-row">
              <button
                v-for="tag in batchTagSuggestions"
                :key="tag"
                class="cardhub-batch__chip"
                :class="{ 'is-active': batchTagSelectedTags.includes(tag) }"
                type="button"
                @click="toggleBatchTagSuggestion(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
          <div class="cardhub-batch__toolbar">
            <button class="cardhub-batch__btn is-secondary" type="button" @click="selectAllBatchTags">全选</button>
            <button class="cardhub-batch__btn is-secondary" type="button" @click="clearBatchTagSelection">清空</button>
            <div class="cardhub-batch__spacer"></div>
            <button class="cardhub-batch__btn is-ghost" type="button" @click="applyBatchTags('remove')">
              移除标签
            </button>
            <button class="cardhub-batch__btn is-primary" type="button" @click="applyBatchTags('add')">添加标签</button>
          </div>
          <div class="cardhub-batch__list">
            <label v-for="item in batchTagVisibleCandidates" :key="item.id" class="cardhub-batch__item">
              <input
                class="cardhub-batch__checkbox"
                type="checkbox"
                :checked="batchTagSelectedSet.has(item.id)"
                @change="toggleBatchTagSelection(item.id)"
              />
              <div class="cardhub-batch__main">
                <div class="cardhub-batch__name">{{ item.name }}</div>
                <div class="cardhub-batch__meta">
                  <span>{{ item.origin === 'tavern' ? '已导入' : '未导入' }}</span>
                  <span>{{ displayTags(item).length }} 标签</span>
                </div>
                <div v-if="displayTags(item).length" class="cardhub-batch__tags">
                  <span v-for="tag in displayTags(item).slice(0, 3)" :key="tag" class="cardhub-batch__tag">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div v-if="exportDialogOpen" class="cardhub-export cardhub-modal" @click.self="closeExportDialog">
      <div class="cardhub-export__panel cardhub-modal__panel" role="dialog" aria-label="批量导出">
        <div class="cardhub-export__header">
          <div>
            <div class="cardhub-export__title">批量导出</div>
            <div class="cardhub-export__subtitle">
              已选 {{ exportSelectedItems.length }} / {{ exportVisibleCandidates.length }}
            </div>
          </div>
          <button class="cardhub-preview__close" type="button" @click="closeExportDialog">×</button>
        </div>
        <div class="cardhub-export__filters">
          <input v-model="exportSearch" class="cardhub-export__search" type="search" placeholder="搜索角色名或标签" />
          <div class="cardhub-export__filter-row">
            <button
              class="cardhub-export__chip"
              :class="{ 'is-active': exportStatusFilter === 'all' }"
              type="button"
              @click="exportStatusFilter = 'all'"
            >
              全部
            </button>
            <button
              class="cardhub-export__chip"
              :class="{ 'is-active': exportStatusFilter === 'imported' }"
              type="button"
              @click="exportStatusFilter = 'imported'"
            >
              已导入
            </button>
            <button
              class="cardhub-export__chip"
              :class="{ 'is-active': exportStatusFilter === 'unimported' }"
              type="button"
              @click="exportStatusFilter = 'unimported'"
            >
              未导入
            </button>
          </div>
          <div class="cardhub-export__filter-row">
            <button
              v-for="tag in exportAllTags"
              :key="tag"
              class="cardhub-export__chip"
              :class="{ 'is-active': exportTagFilters.includes(tag) }"
              type="button"
              @click="toggleExportTagFilter(tag)"
            >
              {{ tag }}
            </button>
            <button
              v-if="exportTagFilters.length"
              class="cardhub-export__chip cardhub-export__chip--clear"
              type="button"
              @click="clearExportTagFilter"
            >
              清空标签
            </button>
          </div>
        </div>
        <div class="cardhub-export__toolbar">
          <button class="cardhub-export__btn is-secondary" type="button" @click="selectAllExport">全选</button>
          <button class="cardhub-export__btn is-secondary" type="button" @click="clearExportSelection">清空</button>
          <div class="cardhub-export__spacer"></div>
          <button class="cardhub-export__btn is-secondary" type="button" @click="closeExportDialog">取消</button>
          <button class="cardhub-export__btn is-primary" type="button" @click="confirmExportSelected">导出已选</button>
        </div>
        <div class="cardhub-export__list">
          <label v-for="item in exportVisibleCandidates" :key="item.id" class="cardhub-export__item">
            <input
              class="cardhub-export__checkbox"
              type="checkbox"
              :checked="isExportSelected(item.id)"
              @change="toggleExportSelection(item.id)"
            />
            <div class="cardhub-export__main">
              <div class="cardhub-export__name">{{ item.name }}</div>
              <div class="cardhub-export__meta">
                <span>{{ item.origin === 'tavern' ? '已导入' : '未导入' }}</span>
                <span>{{ displayTags(item).length }} 标签</span>
              </div>
              <div v-if="displayTags(item).length" class="cardhub-export__tags">
                <span v-for="tag in displayTags(item).slice(0, 3)" :key="tag" class="cardhub-export__tag">
                  {{ tag }}
                </span>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>

    <div v-if="settingsDialogOpen" class="cardhub-settings cardhub-modal" @click.self="closeSettingsDialog">
      <div class="cardhub-settings__panel cardhub-modal__panel" role="dialog" aria-label="设置">
        <div class="cardhub-settings__header">
          <div>
            <div class="cardhub-settings__title">设置</div>
            <div class="cardhub-settings__subtitle">用于调整私有库在本地的存储方式</div>
          </div>
          <button class="cardhub-preview__close" type="button" @click="closeSettingsDialog">×</button>
        </div>
        <div class="cardhub-settings__section">
          <div class="cardhub-settings__label">私有库存储位置</div>
          <div class="cardhub-settings__hint">
            当前：{{ storageModeCurrentLabel }}。切换后会迁移现有私有库数据，仅影响未导入角色卡。
          </div>
          <div class="cardhub-settings__options">
            <label class="cardhub-settings__option" :class="{ 'is-active': storageModeDraft === 'variables' }">
              <input v-model="storageModeDraft" type="radio" value="variables" />
              <div class="cardhub-settings__option-body">
                <div class="cardhub-settings__option-title">酒馆助手变量</div>
                <div class="cardhub-settings__option-desc">无需额外权限，但数据量大时会变慢。</div>
              </div>
            </label>
            <label
              class="cardhub-settings__option"
              :class="{ 'is-active': storageModeDraft === 'indexeddb', 'is-disabled': !indexedDbAvailable }"
            >
              <input v-model="storageModeDraft" type="radio" value="indexeddb" :disabled="!indexedDbAvailable" />
              <div class="cardhub-settings__option-body">
                <div class="cardhub-settings__option-title">浏览器 IndexedDB</div>
                <div class="cardhub-settings__option-desc">
                  适合大体积私有库，但仅在当前浏览器生效，换设备会丢失。
                </div>
                <div v-if="!indexedDbAvailable" class="cardhub-settings__option-warn">当前浏览器不支持。</div>
              </div>
            </label>
          </div>
        </div>
        <div class="cardhub-settings__section">
          <div class="cardhub-settings__label">列表显示</div>
          <div class="cardhub-settings__options cardhub-settings__options--compact">
            <label class="cardhub-settings__row">
              <span>每页数量</span>
              <select v-model.number="uiSettingsDraft.pageSize" class="cardhub-settings__select">
                <option :value="12">12</option>
                <option :value="24">24</option>
                <option :value="36">36</option>
                <option :value="48">48</option>
              </select>
            </label>
            <label class="cardhub-settings__row cardhub-settings__toggle">
              <span>显示备注摘要</span>
              <input v-model="uiSettingsDraft.showNoteSummary" type="checkbox" />
            </label>
            <label class="cardhub-settings__row">
              <span>标签默认行数</span>
              <select v-model.number="uiSettingsDraft.tagRows" class="cardhub-settings__select">
                <option :value="1">1</option>
                <option :value="2">2</option>
                <option :value="3">3</option>
                <option :value="4">4</option>
              </select>
            </label>
            <label class="cardhub-settings__row">
              <span>头像大小</span>
              <select v-model="uiSettingsDraft.avatarSize" class="cardhub-settings__select">
                <option value="sm">小</option>
                <option value="md">中</option>
                <option value="lg">大</option>
              </select>
            </label>
            <label class="cardhub-settings__row cardhub-settings__toggle">
              <span>同步酒馆标签</span>
              <input v-model="uiSettingsDraft.syncTavernTags" type="checkbox" />
            </label>
          </div>
        </div>
        <div class="cardhub-settings__section">
          <div class="cardhub-settings__label">导出默认格式</div>
          <div class="cardhub-settings__options cardhub-settings__options--compact">
            <label class="cardhub-settings__row cardhub-settings__radio">
              <input v-model="uiSettingsDraft.exportFormat" type="radio" value="png" />
              <span>PNG</span>
            </label>
            <label class="cardhub-settings__row cardhub-settings__radio">
              <input v-model="uiSettingsDraft.exportFormat" type="radio" value="json" />
              <span>JSON</span>
            </label>
          </div>
        </div>
        <div class="cardhub-settings__section">
          <div class="cardhub-settings__label">私有库备份</div>
          <div class="cardhub-settings__hint">导出当前私有库为 JSON 文件，便于手动备份或迁移。</div>
          <div class="cardhub-settings__backup">
            <button class="cardhub-settings__btn is-secondary" type="button" @click="exportLibraryBackup">
              导出私有库
            </button>
            <button class="cardhub-settings__btn is-secondary" type="button" @click="triggerBackupImport">
              导入私有库
            </button>
            <input
              ref="backupImportInput"
              class="cardhub-import-input"
              type="file"
              accept=".json"
              @change="handleBackupImport"
            />
          </div>
        </div>
        <div class="cardhub-settings__actions">
          <button class="cardhub-settings__btn is-secondary" type="button" @click="closeSettingsDialog">取消</button>
          <div class="cardhub-settings__spacer"></div>
          <button
            class="cardhub-settings__btn is-primary"
            type="button"
            :disabled="(!storageModeDirty && !uiSettingsDirty) || storageSaveBusy"
            @click="saveSettingsDialog"
          >
            {{ storageSaveBusy ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="themeDialogOpen" class="cardhub-theme cardhub-modal" @click.self="closeThemeDialog">
      <div class="cardhub-theme__panel cardhub-modal__panel" role="dialog" aria-label="配色设置">
        <div class="cardhub-theme__header">
          <div>
            <div class="cardhub-theme__title">配色设置</div>
            <div class="cardhub-theme__subtitle">修改后可直接预览，保存到全局</div>
          </div>
          <button class="cardhub-preview__close" type="button" @click="closeThemeDialog">×</button>
        </div>
        <div class="cardhub-theme__grid">
          <label class="cardhub-theme__field">
            <span>背景渐变 1</span>
            <input v-model="themeDraft.bgStart" type="color" />
          </label>
          <label class="cardhub-theme__field">
            <span>背景渐变 2</span>
            <input v-model="themeDraft.bgEnd" type="color" />
          </label>
          <label class="cardhub-theme__field">
            <span>卡片/面板底色</span>
            <input v-model="themeDraft.surface" type="color" />
          </label>
          <label class="cardhub-theme__field">
            <span>浅色底</span>
            <input v-model="themeDraft.surfaceAlt" type="color" />
          </label>
          <label class="cardhub-theme__field">
            <span>主文本</span>
            <input v-model="themeDraft.text" type="color" />
          </label>
          <label class="cardhub-theme__field">
            <span>次级文本</span>
            <input v-model="themeDraft.textMuted" type="color" />
          </label>
          <label class="cardhub-theme__field">
            <span>强调色</span>
            <input v-model="themeDraft.accent" type="color" />
          </label>
          <label class="cardhub-theme__field">
            <span>强调深色</span>
            <input v-model="themeDraft.accentStrong" type="color" />
          </label>
          <label class="cardhub-theme__field">
            <span>边框</span>
            <input v-model="themeDraft.border" type="color" />
          </label>
        </div>
        <div class="cardhub-theme__presets">
          <button
            v-for="preset in themePresets"
            :key="preset.name"
            class="cardhub-theme__preset"
            type="button"
            @click="applyThemePreset(preset)"
          >
            {{ preset.name }}
          </button>
        </div>
        <div class="cardhub-theme__actions">
          <button class="cardhub-theme__btn is-secondary" type="button" @click="resetThemeDraft">恢复默认</button>
          <div class="cardhub-theme__spacer"></div>
          <button class="cardhub-theme__btn is-secondary" type="button" @click="closeThemeDialog">取消</button>
          <button class="cardhub-theme__btn is-primary" type="button" @click="saveThemeDraft">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, toRef, watch } from 'vue';
import { cardHubState as state, setCharacters, setLibrary, setLoading, setOpen } from '../state/store';
import { fetchCharacterSummaries } from '../services/characterSource';
import type { CardHubItem } from '../types';
import {
  addToLibrary,
  loadLibrary,
  persistLibrary,
  normalizeLibraryEntries,
  mergeLibraryEntries,
  parseLibraryBackup,
  removeFromLibrary,
  updateLibraryNote,
  updateLibraryTags,
} from '../services/libraryService';
import { getMergedTags, updateCharacterTags } from '../services/tagService';
import { loadStorageSettings, saveStorageSettings, type StorageMode } from '../services/storageSettings';
import { loadGlobalState, updateGlobalState } from '../services/globalState';
import ManageModal from './components/ManageModal.vue';
import { useBatchTags } from './composables/useBatchTags';
import { useLibraryActions } from './composables/useLibraryActions';
import { useTagEditing } from './composables/useTagEditing';
import { useTagFilters } from './composables/useTagFilters';

const statusFilter = ref<'all' | 'imported' | 'unimported' | 'duplicate'>('all');
const pageSize = ref(24);
const currentPage = ref(1);
const manageCard = ref<CardHubItem | null>(null);
type ConfirmResult = 'confirm' | 'cancel' | 'alt';
type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  altLabel?: string;
};

const confirmState = reactive({
  open: false,
  title: '',
  message: '',
  confirmLabel: '确定',
  cancelLabel: '取消',
  altLabel: '',
  resolve: null as null | ((result: ConfirmResult) => void),
});

const allCards = computed(() => [...state.characters, ...state.library]);
const mergedTagsMap = computed(() => {
  const map = new Map<string, string[]>();
  allCards.value.forEach(card => {
    map.set(card.id, resolveMergedTags(card));
  });
  return map;
});
const duplicateIdSet = computed(() => {
  const duplicates = new Set<string>();
  const tavernNameSet = new Set<string>();
  const tavernAvatarSet = new Set<string>();
  state.characters.forEach(card => {
    tavernNameSet.add(normalizeNameKey(card.name));
    if (card.avatar) {
      const base = normalizeAvatarBase(card.avatar);
      if (base) {
        tavernAvatarSet.add(base);
      }
    }
  });
  const libraryNameSet = new Set<string>();
  const libraryFileSet = new Set<string>();
  state.library.forEach(entry => {
    libraryNameSet.add(normalizeNameKey(entry.name));
    if (entry.importFileName) {
      const base = normalizeFileBase(entry.importFileName);
      if (base) {
        libraryFileSet.add(base);
      }
    }
  });
  state.characters.forEach(card => {
    const nameKey = normalizeNameKey(card.name);
    const avatarBase = card.avatar ? normalizeAvatarBase(card.avatar) : '';
    if (libraryNameSet.has(nameKey) || (avatarBase && libraryFileSet.has(avatarBase))) {
      duplicates.add(card.id);
    }
  });
  state.library.forEach(entry => {
    const nameKey = normalizeNameKey(entry.name);
    const fileBase = entry.importFileName ? normalizeFileBase(entry.importFileName) : '';
    if (tavernNameSet.has(nameKey) || (fileBase && tavernAvatarSet.has(fileBase))) {
      duplicates.add(entry.id);
    }
  });
  return duplicates;
});
const { selectedTags, allTags, applyTagFilter, toggleTagFilter, clearTagFilter } = useTagFilters(
  allCards,
  resolveMergedTags,
);

const favoriteIds = ref<string[]>([]);
const favoriteSet = computed(() => new Set(favoriteIds.value));
const sortKey = ref<'recent' | 'name' | 'tags' | 'imported'>('recent');
const favoritesOnly = ref(false);
const lastChatCache = ref<Record<string, number>>({});
const importCache = ref<Record<string, number>>({});
const noteMap = ref<Record<string, string>>({});

type CardHubTheme = {
  bgStart: string;
  bgEnd: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentStrong: string;
  border: string;
};

const defaultTheme: CardHubTheme = {
  bgStart: '#f6f8fb',
  bgEnd: '#e6ebf2',
  surface: '#fdfdfe',
  surfaceAlt: '#f1f4f9',
  text: '#1b1e22',
  textMuted: '#6b7480',
  accent: '#7fb3e1',
  accentStrong: '#243a52',
  border: '#d5dde8',
};

const themeDialogOpen = ref(false);
const themeCurrent = ref<CardHubTheme>({ ...defaultTheme });
const themeDraft = reactive<CardHubTheme>({ ...defaultTheme });
const themeStyle = computed<Record<string, string>>(() => {
  const theme = themeDialogOpen.value ? (themeDraft as CardHubTheme) : themeCurrent.value;
  const avatarSize = uiSettingsCurrent.avatarSize;
  const avatarDesktop = avatarSize === 'sm' ? 36 : avatarSize === 'lg' ? 50 : 42;
  const avatarMobile = avatarSize === 'sm' ? 34 : avatarSize === 'lg' ? 46 : 40;
  return {
    '--cardhub-bg-start': theme.bgStart,
    '--cardhub-bg-end': theme.bgEnd,
    '--cardhub-surface': theme.surface,
    '--cardhub-surface-alt': theme.surfaceAlt,
    '--cardhub-text': theme.text,
    '--cardhub-text-muted': theme.textMuted,
    '--cardhub-accent': theme.accent,
    '--cardhub-accent-strong': theme.accentStrong,
    '--cardhub-border': theme.border,
    '--cardhub-surface-rgb': hexToRgb(theme.surface),
    '--cardhub-surface-alt-rgb': hexToRgb(theme.surfaceAlt),
    '--cardhub-border-rgb': hexToRgb(theme.border),
    '--cardhub-accent-rgb': hexToRgb(theme.accent),
    '--cardhub-accent-strong-rgb': hexToRgb(theme.accentStrong),
    '--cardhub-accent-text': contrastTextColor(theme.accent),
    '--cardhub-accent-strong-text': contrastTextColor(theme.accentStrong),
    '--cardhub-tag-rows': String(uiSettingsCurrent.tagRows),
    '--cardhub-avatar-size': `${avatarDesktop}px`,
    '--cardhub-avatar-size-mobile': `${avatarMobile}px`,
  };
});

const settingsDialogOpen = ref(false);
const storageModeCurrent = ref<StorageMode>('variables');
const storageModeDraft = ref<StorageMode>('variables');
const storageSaveBusy = ref(false);
const indexedDbAvailable = ref(true);
const storageModeLabels: Record<StorageMode, string> = {
  variables: '酒馆助手变量',
  indexeddb: '浏览器 IndexedDB',
};
const storageModeCurrentLabel = computed(() => storageModeLabels[storageModeCurrent.value]);
const storageModeDirty = computed(() => storageModeDraft.value !== storageModeCurrent.value);
type UiSettings = {
  pageSize: number;
  showNoteSummary: boolean;
  exportFormat: 'png' | 'json';
  tagRows: number;
  avatarSize: 'sm' | 'md' | 'lg';
  syncTavernTags: boolean;
};
const defaultUiSettings: UiSettings = {
  pageSize: 24,
  showNoteSummary: true,
  exportFormat: 'png',
  tagRows: 2,
  avatarSize: 'md',
  syncTavernTags: true,
};
const uiSettingsCurrent = reactive<UiSettings>({ ...defaultUiSettings });
const uiSettingsDraft = reactive<UiSettings>({ ...defaultUiSettings });
const uiSettingsDirty = computed(
  () =>
    uiSettingsDraft.pageSize !== uiSettingsCurrent.pageSize ||
    uiSettingsDraft.showNoteSummary !== uiSettingsCurrent.showNoteSummary ||
    uiSettingsDraft.exportFormat !== uiSettingsCurrent.exportFormat ||
    uiSettingsDraft.tagRows !== uiSettingsCurrent.tagRows ||
    uiSettingsDraft.avatarSize !== uiSettingsCurrent.avatarSize ||
    uiSettingsDraft.syncTavernTags !== uiSettingsCurrent.syncTavernTags,
);
const showNoteSummary = computed(() => uiSettingsCurrent.showNoteSummary);
const backupImportInput = ref<HTMLInputElement | null>(null);

function normalizeUiSettings(raw: unknown): UiSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultUiSettings };
  }
  const data = raw as Record<string, unknown>;
  const pageSizeValue = Number(data.pageSize);
  const pageSizeAllowed = [12, 24, 36, 48];
  const pageSizeNormalized = pageSizeAllowed.includes(pageSizeValue) ? pageSizeValue : defaultUiSettings.pageSize;
  const showNoteSummaryValue =
    typeof data.showNoteSummary === 'boolean' ? data.showNoteSummary : defaultUiSettings.showNoteSummary;
  const exportFormatValue =
    data.exportFormat === 'json' || data.exportFormat === 'png' ? data.exportFormat : defaultUiSettings.exportFormat;
  const tagRowsValue = Number(data.tagRows);
  const tagRowsAllowed = [1, 2, 3, 4];
  const tagRowsNormalized = tagRowsAllowed.includes(tagRowsValue) ? tagRowsValue : defaultUiSettings.tagRows;
  const avatarSizeValue = data.avatarSize === 'sm' || data.avatarSize === 'lg' ? data.avatarSize : 'md';
  const syncTavernTagsValue =
    typeof data.syncTavernTags === 'boolean' ? data.syncTavernTags : defaultUiSettings.syncTavernTags;
  return {
    pageSize: pageSizeNormalized,
    showNoteSummary: showNoteSummaryValue,
    exportFormat: exportFormatValue,
    tagRows: tagRowsNormalized,
    avatarSize: avatarSizeValue,
    syncTavernTags: syncTavernTagsValue,
  };
}

function syncUiSettings() {
  const state = loadGlobalState();
  const normalized = normalizeUiSettings(state?.uiSettings);
  Object.assign(uiSettingsCurrent, normalized);
  Object.assign(uiSettingsDraft, normalized);
  pageSize.value = normalized.pageSize;
}

function saveUiSettings() {
  Object.assign(uiSettingsCurrent, uiSettingsDraft);
  updateGlobalState({ uiSettings: { ...uiSettingsCurrent } });
  pageSize.value = uiSettingsCurrent.pageSize;
}
const themePresets = [
  {
    name: '晨雾',
    value: {
      bgStart: '#f6f8fb',
      bgEnd: '#e6ebf2',
      surface: '#fdfdfe',
      surfaceAlt: '#f1f4f9',
      text: '#1b1e22',
      textMuted: '#6b7480',
      accent: '#7fb3e1',
      accentStrong: '#243a52',
      border: '#d5dde8',
    },
  },
  {
    name: '白天',
    value: {
      bgStart: '#fdfaf4',
      bgEnd: '#f2ebe1',
      surface: '#fffefb',
      surfaceAlt: '#f7efe6',
      text: '#1d1a17',
      textMuted: '#7a6f63',
      accent: '#e3a981',
      accentStrong: '#3f2c22',
      border: '#e4d7c8',
    },
  },
  {
    name: '夜晚',
    value: {
      bgStart: '#14181d',
      bgEnd: '#0d1116',
      surface: '#1e242b',
      surfaceAlt: '#242b34',
      text: '#eef2f7',
      textMuted: '#b2bdc9',
      accent: '#6fa2d1',
      accentStrong: '#d7e6f4',
      border: '#36414c',
    },
  },
  {
    name: '茶棕',
    value: {
      bgStart: '#f7f1e7',
      bgEnd: '#e6d8c6',
      surface: '#fcf6ee',
      surfaceAlt: '#f2e4d6',
      text: '#2a1f18',
      textMuted: '#8a6d5a',
      accent: '#c47b52',
      accentStrong: '#3e2a22',
      border: '#ddc7b4',
    },
  },
  {
    name: '赤陶',
    value: {
      bgStart: '#fbf1ea',
      bgEnd: '#ecd5c8',
      surface: '#fff7f1',
      surfaceAlt: '#f4e1d6',
      text: '#2d2018',
      textMuted: '#8b6a5a',
      accent: '#d17a4f',
      accentStrong: '#4c2d21',
      border: '#e3c3b3',
    },
  },
  {
    name: '薄荷',
    value: {
      bgStart: '#f2fbf7',
      bgEnd: '#dcefe7',
      surface: '#f9fffd',
      surfaceAlt: '#e8f4f0',
      text: '#1a2a26',
      textMuted: '#5f7a73',
      accent: '#60b6a4',
      accentStrong: '#1f4c43',
      border: '#c5ddd5',
    },
  },
  {
    name: '海盐',
    value: {
      bgStart: '#f3f8fb',
      bgEnd: '#d9e7f3',
      surface: '#f9fcff',
      surfaceAlt: '#e9f2f9',
      text: '#1b2530',
      textMuted: '#5f7388',
      accent: '#5da3cf',
      accentStrong: '#1f3e57',
      border: '#c8d9e7',
    },
  },
  {
    name: '石墨',
    value: {
      bgStart: '#2a2d33',
      bgEnd: '#1e2126',
      surface: '#333741',
      surfaceAlt: '#3b404b',
      text: '#f3f5f8',
      textMuted: '#c1c7d0',
      accent: '#9aa6b2',
      accentStrong: '#e0e5ea',
      border: '#4b5261',
    },
  },
] as const;
const filteredCharacters = computed(() => {
  const list = applyFavoriteFilter(applyStatusFilter(allCards.value));
  const keyword = state.search.trim().toLowerCase();
  if (!keyword) {
    return sortCards(applyTagFilter(list));
  }
  return sortCards(
    applyTagFilter(list).filter(character => {
      const name = character.name.toLowerCase();
      if (name.includes(keyword)) {
        return true;
      }
      const tags = mergedTagsMap.value.get(character.id) ?? getMergedTags(character);
      return tags.some(tag => tag.toLowerCase().includes(keyword));
    }),
  );
});

const {
  tagManagerOpen,
  tagManagerTab,
  openTagManager,
  closeTagManager,
  batchTagSelectedIds,
  batchTagSearch,
  batchTagInput,
  batchTagSelectedTags,
  batchTagSelectedSet,
  batchTagVisibleCandidates,
  batchTagSuggestions,
  toggleBatchTagSelection,
  selectAllBatchTags,
  clearBatchTagSelection,
  toggleBatchTagSuggestion,
  applyBatchTags,
} = useBatchTags({
  allCards,
  filteredCharacters,
  allTags,
  displayTags,
  applyTagUpdate,
  openConfirm,
});

const stateSearch = toRef(state, 'search');
const {
  importInput,
  exportDialogOpen,
  exportSearch,
  exportStatusFilter,
  exportTagFilters,
  exportAllTags,
  exportVisibleCandidates,
  exportSelectedItems,
  exportSelectedIds,
  openExportDialog,
  exportSelected,
  confirmExportSelected,
  isExportSelected,
  toggleExportSelection,
  selectAllExport,
  clearExportSelection,
  triggerImport,
  handleImportFiles,
  handleCardAction,
  importLibraryCard,
  exportCard,
  exportLibraryCard,
  manageDelete,
} = useLibraryActions({
  allCards,
  stateSearch,
  selectedTags,
  statusFilter,
  getCharacters: () => state.characters,
  getLibrary: () => state.library,
  setLibrary,
  setCharacters: setCharactersWithNotes,
  fetchCharacterSummaries,
  addToLibrary,
  parseLibraryBackup,
  normalizeLibraryEntries,
  mergeLibraryEntries,
  persistLibrary,
  removeFromLibrary,
  updateCharacterTags: updateCharacterTagsWithSetting,
  parseLibraryCardData,
  extractCardTagsFromData,
  normalizeNameKey,
  normalizeAvatarKey,
  dataUrlToBlob,
  downloadBlob,
  openConfirm,
  closeManage,
  sleep,
  getExportFormat: () => uiSettingsCurrent.exportFormat,
});

const totalPages = computed(() => {
  const total = Math.ceil(filteredCharacters.value.length / pageSize.value);
  return total > 0 ? total : 1;
});

const pagedCharacters = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredCharacters.value.slice(start, start + pageSize.value);
});

function avatarUrl(character: CardHubItem, useFull = false): string | null {
  const avatar = character.avatar;
  if (!avatar) {
    return null;
  }
  if (/^(data:|https?:|\/)/.test(avatar)) {
    return avatar;
  }
  if (useFull && character.origin === 'tavern') {
    return TavernHelper.getCharAvatarPath(avatar, true) ?? `/thumbnail?type=avatar&file=${encodeURIComponent(avatar)}`;
  }
  return `/thumbnail?type=avatar&file=${encodeURIComponent(avatar)}`;
}

function avatarStyle(character: CardHubItem): Record<string, string> {
  const url = avatarUrl(character);
  return url ? { backgroundImage: `url(${url})` } : {};
}

function displayTags(character: CardHubItem): string[] {
  return mergedTagsMap.value.get(character.id) ?? resolveMergedTags(character);
}

function buildNoteCandidates(card: CardHubItem): string[] {
  const candidates = new Set<string>();
  if (card.origin !== 'tavern') {
    return [];
  }
  const rawValues = [card.tagKey, card.avatar, card.name].filter(Boolean) as string[];
  rawValues.forEach(value => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    candidates.add(`tavern:${trimmed}`);
    if (trimmed.includes('::')) {
      candidates.add(`tavern:${trimmed.split('::')[0]}`);
    }
    if (trimmed.startsWith('name:')) {
      const namePart = trimmed.slice(5).split('::')[0];
      if (namePart) {
        candidates.add(`tavern:${namePart}`);
      }
    }
    const baseName = trimmed.includes('/') ? trimmed.split('/').pop() : trimmed;
    if (baseName && baseName !== trimmed) {
      candidates.add(`tavern:${baseName}`);
    }
    try {
      const decoded = decodeURIComponent(trimmed);
      if (decoded && decoded !== trimmed) {
        candidates.add(`tavern:${decoded}`);
      }
    } catch {
      // ignore decode errors
    }
  });
  return Array.from(candidates);
}

function resolveNoteForCard(card: CardHubItem): string {
  if (card.origin === 'tavern') {
    const candidates = buildNoteCandidates(card);
    for (const key of candidates) {
      const note = noteMap.value[key];
      if (note && note.trim()) {
        return note.trim();
      }
    }
  }
  return card.note?.trim() ?? '';
}

function displayNote(character: CardHubItem): string {
  return resolveNoteForCard(character);
}

function resolveMergedTags(card: CardHubItem): string[] {
  if (card.origin === 'library') {
    return card.tags ?? [];
  }
  if (!uiSettingsCurrent.syncTavernTags) {
    return card.tags ?? [];
  }
  return getMergedTags(card);
}

function updateCharacterTagsWithSetting(target: CardHubItem, nextTags: string[]): string[] {
  if (!uiSettingsCurrent.syncTavernTags) {
    const cleaned = Array.from(new Set(nextTags.map(tag => tag.trim()).filter(Boolean)));
    return cleaned;
  }
  return updateCharacterTags(target, nextTags);
}

function applyFavoriteFilter(list: CardHubItem[]): CardHubItem[] {
  if (!favoritesOnly.value) {
    return list;
  }
  return list.filter(item => favoriteSet.value.has(item.id));
}

function getFavoriteList(): string[] {
  const state = loadGlobalState();
  const raw = state?.favorites;
  return Array.isArray(raw) ? raw.filter(item => typeof item === 'string') : [];
}

function saveFavoriteList(list: string[]) {
  updateGlobalState({ favorites: list });
}

function loadLastChatCache(): Record<string, number> {
  const state = loadGlobalState();
  const raw = state?.lastChatCache;
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const entries = Object.entries(raw as Record<string, unknown>).filter(
    ([, value]) => typeof value === 'number' && !Number.isNaN(value),
  );
  return Object.fromEntries(entries) as Record<string, number>;
}

function saveLastChatCache(cache: Record<string, number>) {
  updateGlobalState({ lastChatCache: cache });
}

function loadImportCache(): Record<string, number> {
  const state = loadGlobalState();
  const raw = state?.importCache;
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const entries = Object.entries(raw as Record<string, unknown>).filter(
    ([, value]) => typeof value === 'number' && !Number.isNaN(value),
  );
  return Object.fromEntries(entries) as Record<string, number>;
}

function saveImportCache(cache: Record<string, number>) {
  updateGlobalState({ importCache: cache });
}

function loadNoteMap(): Record<string, string> {
  const state = loadGlobalState();
  const raw = state?.notes;
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const entries = Object.entries(raw as Record<string, unknown>).filter(
    ([, value]) => typeof value === 'string' && value.trim().length > 0,
  );
  return Object.fromEntries(entries) as Record<string, string>;
}

function saveNoteMap(map: Record<string, string>) {
  updateGlobalState({ notes: map });
}

function getChatCacheKey(card: CardHubItem): string | null {
  if (card.origin !== 'tavern') {
    return null;
  }
  if (card.avatar) {
    return `avatar:${card.avatar}`;
  }
  if (card.name) {
    return `name:${card.name}`;
  }
  return null;
}

function getImportAt(card: CardHubItem): number {
  if (typeof card.createdAt === 'number' && card.createdAt > 0) {
    return card.createdAt;
  }
  const key = getChatCacheKey(card);
  return key ? (importCache.value[key] ?? 0) : 0;
}

function getLastChatAt(card: CardHubItem): number {
  if (typeof card.lastChatAt === 'number' && card.lastChatAt > 0) {
    return card.lastChatAt;
  }
  const key = getChatCacheKey(card);
  return key ? (lastChatCache.value[key] ?? 0) : 0;
}

function updateLastChatCache(key: string, timestamp: number) {
  const next = { ...lastChatCache.value, [key]: timestamp };
  lastChatCache.value = next;
  saveLastChatCache(next);
}

function updateLastChatCacheForCard(card: CardHubItem, timestamp: number) {
  if (timestamp <= 0 || card.origin !== 'tavern') {
    return;
  }
  const keys = new Set<string>();
  if (card.avatar) {
    keys.add(`avatar:${card.avatar}`);
  }
  if (card.name) {
    keys.add(`name:${card.name}`);
  }
  if (!keys.size) {
    return;
  }
  const next = { ...lastChatCache.value };
  let changed = false;
  keys.forEach(key => {
    if ((next[key] ?? 0) < timestamp) {
      next[key] = timestamp;
      changed = true;
    }
  });
  if (changed) {
    lastChatCache.value = next;
    saveLastChatCache(next);
  }
}
function updateImportCache(next: Record<string, number>) {
  importCache.value = next;
  saveImportCache(next);
}

function isFavorite(id: string): boolean {
  return favoriteSet.value.has(id);
}

function toggleFavorite(card: CardHubItem) {
  if (favoriteSet.value.has(card.id)) {
    favoriteIds.value = favoriteIds.value.filter(item => item !== card.id);
  } else {
    favoriteIds.value = [...favoriteIds.value, card.id];
  }
  saveFavoriteList(favoriteIds.value);
}

function sortCards(list: CardHubItem[]): CardHubItem[] {
  const withScore = list.map(item => {
    const tags = mergedTagsMap.value.get(item.id) ?? getMergedTags(item);
    return {
      item,
      tagCount: tags.length,
    };
  });
  const byName = (a: string, b: string) => a.localeCompare(b, 'zh-CN');

  return withScore
    .sort((lhs, rhs) => {
      const a = lhs.item;
      const b = rhs.item;
      if (sortKey.value === 'name') {
        return byName(a.name, b.name);
      }
      if (sortKey.value === 'tags') {
        if (rhs.tagCount !== lhs.tagCount) {
          return rhs.tagCount - lhs.tagCount;
        }
        return byName(a.name, b.name);
      }
      if (sortKey.value === 'imported') {
        const aTime = getImportAt(a);
        const bTime = getImportAt(b);
        if (bTime !== aTime) {
          return bTime - aTime;
        }
        return byName(a.name, b.name);
      }
      const aTime = getLastChatAt(a);
      const bTime = getLastChatAt(b);
      if (bTime !== aTime) {
        return bTime - aTime;
      }
      const aCreated = a.createdAt ?? 0;
      const bCreated = b.createdAt ?? 0;
      if (bCreated !== aCreated) {
        return bCreated - aCreated;
      }
      return byName(a.name, b.name);
    })
    .map(entry => entry.item);
}

function isLibraryItem(item: CardHubItem): boolean {
  if (item.origin === 'library' || Boolean(item.rawType)) {
    return true;
  }
  return state.library.some(entry => entry.id === item.id);
}

function applyStatusFilter(list: CardHubItem[]): CardHubItem[] {
  if (statusFilter.value === 'imported') {
    return list.filter(item => !isLibraryItem(item));
  }
  if (statusFilter.value === 'unimported') {
    return list.filter(item => isLibraryItem(item));
  }
  if (statusFilter.value === 'duplicate') {
    return list.filter(item => duplicateIdSet.value.has(item.id));
  }
  return list;
}

function hexToRgb(value: string): string {
  const hex = value.replace('#', '');
  if (hex.length !== 6) {
    return '0, 0, 0';
  }
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function contrastTextColor(value: string): string {
  const rgb = hexToRgb(value)
    .split(',')
    .map(part => Number(part.trim()));
  if (rgb.length !== 3) {
    return '#1b1b1b';
  }
  const [r, g, b] = rgb.map(channel => channel / 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? '#1b1b1b' : '#ffffff';
}

function normalizeTheme(raw: unknown): CardHubTheme {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultTheme };
  }
  const data = raw as Record<string, string>;
  const pick = (key: keyof CardHubTheme) => {
    const value = data[key];
    return /^#[0-9a-f]{6}$/i.test(value) ? value : defaultTheme[key];
  };
  return {
    bgStart: pick('bgStart'),
    bgEnd: pick('bgEnd'),
    surface: pick('surface'),
    surfaceAlt: pick('surfaceAlt'),
    text: pick('text'),
    textMuted: pick('textMuted'),
    accent: pick('accent'),
    accentStrong: pick('accentStrong'),
    border: pick('border'),
  };
}

function getCardHubRoot(): HTMLElement | null {
  try {
    return (window.parent?.document ?? document).querySelector<HTMLElement>('.cardhub-root');
  } catch {
    return document.querySelector<HTMLElement>('.cardhub-root');
  }
}

let themeFrame = 0;
let themeTimer: number | null = null;
function scheduleThemeApply(theme: CardHubTheme) {
  if (themeFrame) {
    cancelAnimationFrame(themeFrame);
    themeFrame = 0;
  }
  if (themeTimer) {
    window.clearTimeout(themeTimer);
  }
  themeTimer = window.setTimeout(() => {
    themeTimer = null;
    themeFrame = requestAnimationFrame(() => {
      themeFrame = 0;
      applyTheme(theme);
    });
  }, 80);
}

function applyTheme(theme: CardHubTheme) {
  const root = getCardHubRoot();
  if (!root) {
    return;
  }
  root.style.setProperty('--cardhub-bg-start', theme.bgStart);
  root.style.setProperty('--cardhub-bg-end', theme.bgEnd);
  root.style.setProperty('--cardhub-surface', theme.surface);
  root.style.setProperty('--cardhub-surface-alt', theme.surfaceAlt);
  root.style.setProperty('--cardhub-text', theme.text);
  root.style.setProperty('--cardhub-text-muted', theme.textMuted);
  root.style.setProperty('--cardhub-accent', theme.accent);
  root.style.setProperty('--cardhub-accent-strong', theme.accentStrong);
  root.style.setProperty('--cardhub-border', theme.border);
  root.style.setProperty('--cardhub-surface-rgb', hexToRgb(theme.surface));
  root.style.setProperty('--cardhub-surface-alt-rgb', hexToRgb(theme.surfaceAlt));
  root.style.setProperty('--cardhub-border-rgb', hexToRgb(theme.border));
  root.style.setProperty('--cardhub-accent-rgb', hexToRgb(theme.accent));
  root.style.setProperty('--cardhub-accent-strong-rgb', hexToRgb(theme.accentStrong));
  root.style.setProperty('--cardhub-accent-text', contrastTextColor(theme.accent));
  root.style.setProperty('--cardhub-accent-strong-text', contrastTextColor(theme.accentStrong));
}

function loadThemeFromGlobal(): CardHubTheme {
  const state = loadGlobalState();
  return normalizeTheme(state?.theme);
}

function saveThemeToGlobal(theme: CardHubTheme) {
  updateGlobalState({ theme });
}

function openThemeDialog() {
  const current = themeCurrent.value;
  Object.assign(themeDraft, current);
  themeDialogOpen.value = true;
  nextTick(() => scheduleThemeApply(current));
}

function closeThemeDialog() {
  themeDialogOpen.value = false;
  Object.assign(themeDraft, themeCurrent.value);
  scheduleThemeApply(themeCurrent.value);
}

function resetThemeDraft() {
  Object.assign(themeDraft, defaultTheme);
}

function saveThemeDraft() {
  themeCurrent.value = { ...themeDraft };
  saveThemeToGlobal(themeCurrent.value);
  scheduleThemeApply(themeCurrent.value);
  themeDialogOpen.value = false;
}

function applyThemePreset(preset: { name: string; value: CardHubTheme }) {
  Object.assign(themeDraft, preset.value);
}

function syncStorageSettings() {
  const settings = loadStorageSettings();
  const normalized = settings.mode === 'indexeddb' || settings.mode === 'variables' ? settings.mode : 'variables';
  storageModeCurrent.value = normalized;
  storageModeDraft.value = normalized;
}

function openSettingsDialog() {
  syncStorageSettings();
  syncUiSettings();
  settingsDialogOpen.value = true;
}

function closeSettingsDialog() {
  settingsDialogOpen.value = false;
  storageModeDraft.value = storageModeCurrent.value;
  Object.assign(uiSettingsDraft, uiSettingsCurrent);
}

async function saveSettingsDialog() {
  if (storageSaveBusy.value || (!storageModeDirty.value && !uiSettingsDirty.value)) {
    settingsDialogOpen.value = false;
    return;
  }
  storageSaveBusy.value = true;
  const nextMode = storageModeDraft.value;
  const prevMode = storageModeCurrent.value;
  try {
    if (storageModeDirty.value) {
      const currentLibrary = await loadLibrary();
      saveStorageSettings({ mode: nextMode });
      await persistLibrary(currentLibrary, nextMode);
      storageModeCurrent.value = nextMode;
      setLibrary(currentLibrary);
    }
    if (uiSettingsDirty.value) {
      saveUiSettings();
    }
    settingsDialogOpen.value = false;
    toastr.success(storageModeDirty.value ? '已切换私有库存储位置' : '已保存设置');
  } catch (error) {
    console.warn('[CardHub] 切换私有库存储失败', error);
    if (storageModeDirty.value) {
      saveStorageSettings({ mode: prevMode });
      storageModeCurrent.value = prevMode;
      storageModeDraft.value = prevMode;
    }
    Object.assign(uiSettingsDraft, uiSettingsCurrent);
    toastr.error('切换存储失败，请稍后重试');
  } finally {
    storageSaveBusy.value = false;
  }
}

async function exportLibraryBackup() {
  const entries = await loadLibrary();
  const blob = new Blob([JSON.stringify({ entries }, null, 2)], { type: 'application/json' });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `cardhub_library_${stamp}.json`);
  toastr.success('已导出私有库备份');
}

function triggerBackupImport() {
  backupImportInput.value?.click();
}

async function handleBackupImport(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const files = target?.files;
  if (!files || !files.length) {
    return;
  }
  const file = files[0];
  try {
    const text = await file.text();
    const backupEntries = parseLibraryBackup(text);
    if (!backupEntries) {
      toastr.error('不是有效的私有库备份文件');
      return;
    }
    const result = await openConfirm({
      title: '导入私有库备份',
      message: '选择“覆盖”会替换现有私有库，选择“合并”会追加进去。',
      confirmLabel: '覆盖',
      altLabel: '合并',
      cancelLabel: '取消',
    });
    if (result === 'cancel') {
      return;
    }
    const normalized = normalizeLibraryEntries(backupEntries);
    const current = state.library;
    const next = result === 'alt' ? mergeLibraryEntries(current, normalized) : normalized;
    setLibrary(next);
    await persistLibrary(next);
    toastr.success(result === 'alt' ? '已合并私有库备份' : '已导入私有库备份');
  } finally {
    if (target) {
      target.value = '';
    }
  }
}

function toggleExportTagFilter(tag: string) {
  if (exportTagFilters.value.includes(tag)) {
    exportTagFilters.value = exportTagFilters.value.filter(item => item !== tag);
  } else {
    exportTagFilters.value = [...exportTagFilters.value, tag];
  }
}

function clearExportTagFilter() {
  exportTagFilters.value = [];
}

watch(
  themeDraft,
  value => {
    if (themeDialogOpen.value) {
      scheduleThemeApply({ ...(value as CardHubTheme) });
    }
  },
  { deep: true },
);

onMounted(() => {
  const theme = loadThemeFromGlobal();
  themeCurrent.value = theme;
  Object.assign(themeDraft, theme);
  nextTick(() => scheduleThemeApply(theme));
  indexedDbAvailable.value = typeof indexedDB !== 'undefined';
  syncStorageSettings();
  syncUiSettings();
  favoriteIds.value = getFavoriteList();
  lastChatCache.value = loadLastChatCache();
  importCache.value = loadImportCache();
  noteMap.value = loadNoteMap();
  void warmRecentChatCache(allCards.value);
  warmImportCache(allCards.value);
});

function closeExportDialog() {
  exportDialogOpen.value = false;
}

watch([() => state.search, statusFilter, () => selectedTags.value.join('|'), sortKey, favoritesOnly], () => {
  currentPage.value = 1;
});

watch([filteredCharacters, totalPages], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value;
  }
  if (currentPage.value < 1) {
    currentPage.value = 1;
  }
});

watch([sortKey, allCards], () => {
  if (sortKey.value === 'recent') {
    void warmRecentChatCache(allCards.value);
  }
  if (sortKey.value === 'imported') {
    warmImportCache(allCards.value);
  }
});

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value -= 1;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1;
  }
}

function normalizeNameKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function normalizeAvatarKey(value: string): string {
  let raw = value.trim();
  if (!raw) {
    return '';
  }
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // ignore
  }
  raw = raw.split('?')[0];
  if (raw.includes('/')) {
    raw = raw.split('/').pop() ?? raw;
  }
  return raw.trim().toLowerCase();
}

function normalizeAvatarBase(value: string): string {
  const raw = normalizeAvatarKey(value);
  return raw.replace(/\.(png|webp|jpg|jpeg)$/i, '');
}

function normalizeFileBase(fileName: string): string {
  return normalizeNameKey(fileName.replace(/\.(png|json)$/i, ''));
}

function getNoteStorageKey(card: CardHubItem): string | null {
  if (card.origin !== 'tavern') {
    return null;
  }
  const key = card.tagKey ?? card.avatar ?? card.name;
  if (!key) {
    return null;
  }
  return `tavern:${key}`;
}

function applyNotesToCharacters(list: CardHubItem[]): CardHubItem[] {
  return list.map(card => {
    const note = resolveNoteForCard(card);
    return { ...card, note };
  });
}

function setCharactersWithNotes(list: CardHubItem[]) {
  setCharacters(applyNotesToCharacters(list));
}

function openConfirm(options: ConfirmOptions): Promise<ConfirmResult> {
  if (confirmState.open && confirmState.resolve) {
    confirmState.resolve('cancel');
  }
  confirmState.title = options.title ?? '确认操作';
  confirmState.message = options.message;
  confirmState.confirmLabel = options.confirmLabel ?? '确定';
  confirmState.cancelLabel = options.cancelLabel ?? '取消';
  confirmState.altLabel = options.altLabel ?? '';
  confirmState.open = true;

  return new Promise(resolve => {
    confirmState.resolve = resolve;
  });
}

function resolveConfirm(result: ConfirmResult) {
  if (!confirmState.open) {
    return;
  }
  confirmState.open = false;
  const resolver = confirmState.resolve;
  confirmState.resolve = null;
  if (resolver) {
    resolver(result);
  }
}

function applyTagUpdate(character: CardHubItem, nextTags: string[]) {
  if (isLibraryItem(character)) {
    const updatedLibrary = updateLibraryTags(character.id, nextTags, state.library);
    setLibrary(updatedLibrary);
  } else {
    const next = updateCharacterTagsWithSetting(character, nextTags);
    character.tags = next;
    setCharacters([...state.characters]);
  }
}

const { tagKey, activeTagKey, tagInput, startTagEdit, cancelTagEdit, confirmTag, removeTag } = useTagEditing({
  getTags: resolveMergedTags,
  applyTagUpdate,
});

function applyNoteUpdate(character: CardHubItem, note: string) {
  const nextNote = note.trim();
  if (isLibraryItem(character)) {
    const updatedLibrary = updateLibraryNote(character.id, nextNote, state.library);
    setLibrary(updatedLibrary);
    const updated = updatedLibrary.find(item => item.id === character.id);
    if (updated) {
      manageCard.value = updated;
    }
    return;
  }
  const key = getNoteStorageKey(character);
  if (!key) {
    return;
  }
  const nextMap = { ...noteMap.value };
  if (nextNote) {
    nextMap[key] = nextNote;
  } else {
    delete nextMap[key];
  }
  noteMap.value = nextMap;
  saveNoteMap(nextMap);
  const updatedCharacters = state.characters.map(card =>
    card.id === character.id ? { ...card, note: nextNote } : card,
  );
  setCharacters(updatedCharacters);
  const updated = updatedCharacters.find(card => card.id === character.id);
  if (updated) {
    manageCard.value = updated;
  }
}

function openManage(card: CardHubItem) {
  const note = resolveNoteForCard(card);
  manageCard.value = note ? { ...card, note } : card;
}

function closeManage() {
  manageCard.value = null;
}

function parseLibraryCardData(card: CardHubItem): any | null {
  if (!card.raw || !card.rawType) {
    return null;
  }
  if (card.rawType === 'json') {
    return parseJsonSafe(card.raw);
  }
  if (card.rawType === 'png') {
    return parsePngCardData(card.raw);
  }
  return null;
}

function parseJsonSafe(raw: string): any | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parsePngCardData(dataUrl: string): any | null {
  const bytes = dataUrlToBytes(dataUrl);
  if (!bytes) {
    return null;
  }
  const chunks = extractPngTextChunks(bytes);
  const allowedKeys = new Set(['chara', 'character', 'tavern', 'tavern_character', 'card']);
  for (const chunk of chunks) {
    if (chunk.key && !allowedKeys.has(chunk.key.toLowerCase())) {
      continue;
    }
    const parsed = parseCardPayload(chunk.value);
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) {
    return null;
  }
  const base64 = dataUrl.slice(comma + 1);
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function extractPngTextChunks(bytes: Uint8Array): Array<{ key: string; value: string }> {
  if (bytes.length < 8) {
    return [];
  }
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[i] !== signature[i]) {
      return [];
    }
  }
  const chunks: Array<{ key: string; value: string }> = [];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = readUint32BE(bytes, offset);
    const type = bytesToString(bytes.subarray(offset + 4, offset + 8));
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.length) {
      break;
    }
    const data = bytes.subarray(dataStart, dataEnd);
    if (type === 'tEXt') {
      const entry = parseTextChunk(data);
      if (entry) {
        chunks.push(entry);
      }
    } else if (type === 'iTXt') {
      const entry = parseIntlTextChunk(data);
      if (entry) {
        chunks.push(entry);
      }
    }
    offset = dataEnd + 4;
  }
  return chunks;
}

function parseTextChunk(data: Uint8Array): { key: string; value: string } | null {
  const nullIndex = data.indexOf(0);
  if (nullIndex < 0) {
    return null;
  }
  const key = bytesToString(data.subarray(0, nullIndex)).trim();
  const value = bytesToString(data.subarray(nullIndex + 1)).trim();
  if (!key || !value) {
    return null;
  }
  return { key, value };
}

function parseIntlTextChunk(data: Uint8Array): { key: string; value: string } | null {
  const nullIndex = data.indexOf(0);
  if (nullIndex < 0 || nullIndex + 2 >= data.length) {
    return null;
  }
  const key = bytesToString(data.subarray(0, nullIndex)).trim();
  const compressed = data[nullIndex + 1] === 1;
  let cursor = nullIndex + 2;
  const langEnd = data.indexOf(0, cursor);
  if (langEnd < 0) {
    return null;
  }
  cursor = langEnd + 1;
  const translatedEnd = data.indexOf(0, cursor);
  if (translatedEnd < 0) {
    return null;
  }
  cursor = translatedEnd + 1;
  if (compressed) {
    return null;
  }
  const value = bytesToString(data.subarray(cursor)).trim();
  if (!key || !value) {
    return null;
  }
  return { key, value };
}

function parseCardPayload(value: string): any | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const direct = parseJsonSafe(trimmed);
  if (direct) {
    return direct;
  }
  if (!isLikelyBase64(trimmed)) {
    return null;
  }
  const decoded = decodeBase64Text(trimmed);
  if (!decoded) {
    return null;
  }
  return parseJsonSafe(decoded);
}

function decodeBase64Text(value: string): string | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function isLikelyBase64(value: string): boolean {
  if (value.length < 16 || value.length % 4 !== 0) {
    return false;
  }
  return /^[A-Za-z0-9+/=]+$/.test(value);
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function extractCardTagsFromData(data: any): string[] {
  const tags = data?.tags ?? data?.data?.tags;
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags
    .filter(tag => typeof tag === 'string')
    .map(tag => tag.trim())
    .filter(Boolean);
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return '';
}

function formatMaybeTimestamp(value: unknown): string {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms).toLocaleString('zh-CN', { hour12: false });
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}

function parseTimestampFromText(raw: string): number | null {
  const text = raw.replace(/\.jsonl$/i, '').trim();
  const pattern = /(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[ T_@-]*(\d{1,2})[:：](\d{1,2})(?:[:：](\d{1,2}))?)?/;
  const match = text.match(pattern);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] ? Number(match[4]) : 0;
  const minute = match[5] ? Number(match[5]) : 0;
  const second = match[6] ? Number(match[6]) : 0;
  if (!year || !month || !day) {
    return null;
  }
  const date = new Date(year, month - 1, day, hour, minute, second);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

function coerceTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

function extractChatLatestTimestamp(entry: any): number | null {
  const candidates = [
    entry?.last_message_time,
    entry?.last_message_date,
    entry?.update_time,
    entry?.last_modified,
    entry?.create_date,
    entry?.timestamp,
    entry?.time,
  ];
  for (const value of candidates) {
    const parsed = coerceTimestamp(value);
    if (parsed) {
      return parsed;
    }
  }
  const fallback = pickString(entry?.file_name, entry?.file_id);
  if (fallback) {
    return parseTimestampFromText(fallback);
  }
  return null;
}

function sortChatBrief(list: any[]): any[] {
  return [...list].sort((lhs, rhs) => {
    const left = extractChatLatestTimestamp(lhs) ?? 0;
    const right = extractChatLatestTimestamp(rhs) ?? 0;
    return right - left;
  });
}

function extractChatLatestLabel(entry: any): string {
  const candidates = [
    entry?.last_message_time,
    entry?.last_message_date,
    entry?.update_time,
    entry?.last_modified,
    entry?.create_date,
    entry?.timestamp,
    entry?.time,
  ];
  for (const value of candidates) {
    const label = formatMaybeTimestamp(value);
    if (label) {
      return label;
    }
  }
  const fallback = pickString(entry?.file_name, entry?.file_id);
  if (!fallback) {
    return '';
  }
  return fallback.replace(/\.jsonl$/i, '');
}

let chatCacheToken = 0;
async function warmRecentChatCache(cards: CardHubItem[]) {
  if (sortKey.value !== 'recent') {
    return;
  }
  const pending = cards.filter(card => {
    if (card.origin !== 'tavern') {
      return false;
    }
    if (typeof card.lastChatAt === 'number' && card.lastChatAt > 0) {
      return false;
    }
    return getLastChatAt(card) <= 0;
  });
  if (!pending.length) {
    return;
  }
  const token = ++chatCacheToken;
  for (const card of pending) {
    if (token !== chatCacheToken || sortKey.value !== 'recent') {
      return;
    }
    if (card.origin !== 'tavern') {
      continue;
    }
    if (typeof card.lastChatAt === 'number' && card.lastChatAt > 0) {
      continue;
    }
    const cached = getLastChatAt(card);
    let brief: unknown = null;
    try {
      brief = await TavernHelper.getChatHistoryBrief(card.name ?? card.avatar ?? '', true);
    } catch (error) {
      console.warn('[CardHub] 读取聊天简报失败', error);
    }
    if (Array.isArray(brief) && brief.length) {
      const sorted = sortChatBrief(brief);
      const timestamp = extractChatLatestTimestamp(sorted[0]) ?? 0;
      if (timestamp > cached) {
        updateLastChatCacheForCard(card, timestamp);
      }
    }
    await sleep(80);
  }
}

function warmImportCache(cards: CardHubItem[]) {
  const next = { ...importCache.value };
  let changed = false;
  const now = Date.now();
  cards.forEach((card, index) => {
    if (card.origin !== 'tavern') {
      return;
    }
    if (typeof card.createdAt === 'number' && card.createdAt > 0) {
      return;
    }
    const key = getChatCacheKey(card);
    if (!key || next[key]) {
      return;
    }
    next[key] = now - (cards.length - 1 - index) * 1000;
    changed = true;
  });
  if (changed) {
    updateImportCache(next);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return await response.blob();
}

async function refresh() {
  setLoading(true);
  try {
    const characters = await fetchCharacterSummaries();
    setCharactersWithNotes(characters);
    const library = await loadLibrary();
    setLibrary(library);
  } finally {
    setLoading(false);
  }
}

function close() {
  setOpen(false);
}
</script>
