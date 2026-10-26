/**
 * HerLog - Application Controller
 * Handles 3-window state machine, PIN authentication, Dashboard operations,
 * Multi-selection & batch deletion, and Markdown Editor/Viewer.
 */

(function() {
  'use strict';

  // =========================================================================
  // APPLICATION STATE
  // =========================================================================
  const state = {
    currentWindow: 'lock', // 'lock' | 'dashboard' | 'editor'
    currentPinInput: '',
    pinLength: 6,
    selectedLogIds: new Set(),
    selectMode: false,
    searchQuery: '',
    sortOrder: 'desc', // 'desc' | 'asc'
    currentEditingLogId: null,
    editorMode: 'raw', // 'raw' | 'dual' | 'rendered'
    isDirty: false,
    pendingDeleteIds: [],
    storageBusy: false
  };

  // =========================================================================
  // DOM ELEMENT REFERENCES
  // =========================================================================
  const el = {
    // Windows
    windowLock: document.getElementById('window-1-lock'),
    windowDashboard: document.getElementById('window-2-dashboard'),
    windowEditor: document.getElementById('window-3-editor'),

    // Window 1: Lock Elements
    pinSlots: document.querySelectorAll('.pin-slot'),
    pinDisplayContainer: document.getElementById('pin-display-container'),
    pinSlotsWrapper: document.getElementById('pin-slots-wrapper'),
    mobilePinInput: document.getElementById('mobile-pin-input'),

    // Window 2: Dashboard Elements
    logListContainer: document.getElementById('log-list-container'),
    logCountIndicator: document.getElementById('log-count-indicator'),
    logSearchInput: document.getElementById('log-search-input'),
    btnToggleSort: document.getElementById('btn-toggle-sort'),
    sortIcon: document.getElementById('sort-icon'),
    sortLabel: document.getElementById('sort-label'),
    btnRefreshLogs: document.getElementById('btn-refresh-logs'),
    selectAllCheckbox: document.getElementById('select-all-checkbox'),
    selectionActionBar: document.getElementById('selection-action-bar'),
    selectionCountText: document.getElementById('selection-count-text'),
    btnSelectAllInline: document.getElementById('btn-select-all-inline'),
    btnClearSelection: document.getElementById('btn-clear-selection'),
    btnDeleteSelected: document.getElementById('btn-delete-selected'),
    btnNewLog: document.getElementById('btn-new-log'),
    btnSelectNotesFolder: document.getElementById('btn-select-notes-folder'),
    notesFolderStatus: document.getElementById('notes-folder-status'),
    storageLocation: document.getElementById('storage-location'),
    btnSelectLog: document.getElementById('btn-select-log'),
    selectedCounterBadge: document.getElementById('selected-counter-badge'),
    statTotalLogs: document.getElementById('stat-total-logs'),
    statTotalWords: document.getElementById('stat-total-words'),
    btnLockVault: document.getElementById('btn-lock-vault'),

    // Window 3: Editor Elements
    editorActiveId: document.getElementById('editor-active-id'),
    autosaveStatus: document.getElementById('autosave-status'),
    btnBackToDashboard: document.getElementById('btn-back-to-dashboard'),
    editorTitleInput: document.getElementById('editor-title-input'),
    btnEditorDiscard: document.getElementById('btn-editor-discard'),
    btnEditorDelete: document.getElementById('btn-editor-delete'),
    btnEditorSave: document.getElementById('btn-editor-save'),
    editorDate: document.getElementById('editor-date'),
    editorDatePicker: document.getElementById('editor-date-picker'),
    editorTime: document.getElementById('editor-time'),
    btnEditorNow: document.getElementById('btn-editor-now'),
    toolbarBtns: document.querySelectorAll('.toolbar-btn'),
    btnInsertTimestamp: document.getElementById('btn-insert-timestamp'),
    tabModeRaw: document.getElementById('tab-mode-raw'),
    tabModeDual: document.getElementById('tab-mode-dual'),
    tabModeRendered: document.getElementById('tab-mode-rendered'),
    editorRawPane: document.getElementById('editor-raw-pane'),
    editorPreviewPane: document.getElementById('editor-preview-pane'),
    editorTextarea: document.getElementById('editor-textarea'),
    markdownRenderTarget: document.getElementById('markdown-render-target'),
    editorWordCount: document.getElementById('editor-word-count'),
    editorCharCount: document.getElementById('editor-char-count'),

    // Modals
    modalConfirmDelete: document.getElementById('modal-confirm-delete'),
    deleteModalDescription: document.getElementById('delete-modal-description'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message, type = 'success') {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    const isError = type === 'error';
    const isWarn = type === 'warn';
    const icon = isError ? 'error' : isWarn ? 'warning' : 'check_circle';
    const borderColor = isError ? 'border-error/40' : isWarn ? 'border-amber-500/40' : 'border-primary/40';
    const iconColor = isError ? 'text-error' : isWarn ? 'text-amber-400' : 'text-primary';

    toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl bg-surface-container-high text-white text-xs font-mono shadow-2xl border ${borderColor} transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-[18px] ${iconColor}">${icon}</span>
      <span>${escapeHtml(message)}</span>
    `;

    el.toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =========================================================================
  // NAVIGATION ROUTER
  // =========================================================================
  function updateStorageUI() {
    const service = window.StorageService;
    const directory = service.notesDirectory;
    const readOnly = !directory;
    if (el.notesFolderStatus) {
      el.notesFolderStatus.textContent = directory ?
        `Local folder: ${directory.name}. New Log creates a .md file; Save updates it.` :
        service.publishedStatus === 'error' ?
          'Could not refresh published notes. See the error message; select a local folder to edit files.' :
          service.publishedStatus === 'loading' ?
            'Loading published notes from notes/...' :
            'Reading published notes from notes/ (read-only). Select a local folder only to create or edit files.';
    }
    if (el.storageLocation) el.storageLocation.textContent = directory ? 'Local Markdown folder' : 'Published notes/';
    if (el.btnSelectLog) el.btnSelectLog.disabled = readOnly;
    if (el.selectAllCheckbox) el.selectAllCheckbox.disabled = readOnly;
    [el.editorTitleInput, el.editorTextarea].filter(Boolean).forEach(input => { input.readOnly = readOnly; });
    [el.editorDate, el.editorDatePicker, el.editorTime, el.btnEditorNow,
      el.btnEditorSave, el.btnEditorDelete, el.btnInsertTimestamp, ...el.toolbarBtns]
      .filter(Boolean).forEach(control => { control.disabled = readOnly; });
  }

  async function runStorageAction(action) {
    if (state.storageBusy) {
      showToast('Please wait for the current folder operation.', 'warn');
      return;
    }
    state.storageBusy = true;
    const panes = [el.windowDashboard, el.windowEditor, el.modalConfirmDelete].filter(Boolean);
    panes.forEach(pane => { pane.inert = true; });
    try {
      await action();
    } catch (error) {
      console.error('Notes folder operation failed:', error);
      showToast(error.name === 'AbortError' ? 'Folder selection cancelled; no note was saved.' : error.message,
        error.name === 'AbortError' ? 'warn' : 'error');
    } finally {
      state.storageBusy = false;
      panes.forEach(pane => { pane.inert = false; });
      updateStorageUI();
      if (state.currentWindow === 'dashboard') renderDashboard();
    }
  }

  function showWindow(target) {
    state.currentWindow = target;

    const winMap = {
      lock: el.windowLock,
      dashboard: el.windowDashboard,
      editor: el.windowEditor
    };

    Object.entries(winMap).forEach(([name, winEl]) => {
      if (!winEl) return;
      if (name === target) {
        winEl.classList.add('active');
        winEl.classList.remove('hidden');
        winEl.style.setProperty('display', 'flex', 'important');
        winEl.style.setProperty('opacity', '1', 'important');
      } else {
        winEl.classList.remove('active');
        winEl.classList.add('hidden');
        winEl.style.setProperty('display', 'none', 'important');
        winEl.style.setProperty('opacity', '0', 'important');
      }
    });

    window.scrollTo({ top: 0, behavior: 'auto' });

    try {
      if (target === 'lock') {
        state.currentPinInput = '';
        if (el.mobilePinInput) {
          el.mobilePinInput.value = '';
          el.mobilePinInput.focus();
        }
        updatePinDisplay();
      } else if (target === 'dashboard') {
        renderDashboard();
      } else if (target === 'editor') {
        updateEditorModeUI();
      }
    } catch (err) {
      console.error('Error during showWindow transition to ' + target + ':', err);
    }
  }

  // =========================================================================
  // WINDOW 1: LOCK SCREEN & 6-PIN LOGIC
  // =========================================================================
  function updatePinDisplay() {
    el.pinSlots.forEach((slot, idx) => {
      const dot = slot.querySelector('.pin-dot');
      if (idx < state.currentPinInput.length) {
        // Entered digit
        slot.classList.add('filled');
        slot.classList.remove('active-cursor');
        dot.className = 'pin-dot w-3 h-3 rounded-full bg-primary shadow-sm scale-110 transition-all duration-150';
      } else if (idx === state.currentPinInput.length) {
        // Active cursor slot
        slot.classList.remove('filled');
        slot.classList.add('active-cursor');
        dot.className = 'pin-dot w-2.5 h-2.5 rounded-full bg-secondary animate-pulse transition-all duration-150';
      } else {
        // Unfilled slot
        slot.classList.remove('filled', 'active-cursor');
        dot.className = 'pin-dot w-2 h-2 rounded-full bg-outline-variant transition-all duration-200';
      }
    });
  }

  function addPinDigit(digit) {
    if (state.currentPinInput.length < state.pinLength) {
      state.currentPinInput += digit;
      if (el.mobilePinInput) el.mobilePinInput.value = state.currentPinInput;
      updatePinDisplay();

      if (state.currentPinInput.length === state.pinLength) {
        setTimeout(validatePin, 150);
      }
    }
  }

  function clearLastPinDigit() {
    if (state.currentPinInput.length > 0) {
      state.currentPinInput = state.currentPinInput.slice(0, -1);
      if (el.mobilePinInput) el.mobilePinInput.value = state.currentPinInput;
      updatePinDisplay();
    }
  }

  function validatePin() {
    if (state.currentPinInput.length !== state.pinLength) {
      triggerPinShake();
      return;
    }

    const isValid = window.StorageService.verifyPin(state.currentPinInput);

    if (isValid) {
      // Success feedback: turn dots bright green
      el.pinSlots.forEach(slot => {
        slot.classList.add('border-primary');
        const dot = slot.querySelector('.pin-dot');
        if (dot) dot.className = 'pin-dot w-3.5 h-3.5 rounded-full bg-primary-fixed shadow-md';
      });

      setTimeout(() => {
        showToast('Vault unlocked');
        showWindow('dashboard');
      }, 250);
    } else {
      // Invalid PIN feedback
      triggerPinShake();
      setTimeout(() => {
        state.currentPinInput = '';
        if (el.mobilePinInput) el.mobilePinInput.value = '';
        updatePinDisplay();
      }, 350);
    }
  }

  function triggerPinShake() {
    if (!el.pinDisplayContainer) return;
    el.pinDisplayContainer.classList.add('animate-shake');
    setTimeout(() => {
      el.pinDisplayContainer.classList.remove('animate-shake');
    }, 400);
  }

  // Focus hidden input on click of slots for mobile keyboard
  if (el.pinSlotsWrapper) {
    el.pinSlotsWrapper.addEventListener('click', () => {
      if (el.mobilePinInput) el.mobilePinInput.focus();
    });
  }

  // Hidden input listener for soft keyboard
  if (el.mobilePinInput) {
    el.mobilePinInput.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/[^0-9]/g, '').slice(0, state.pinLength);
      e.target.value = clean;
      state.currentPinInput = clean;
      updatePinDisplay();

      if (clean.length === state.pinLength) {
        setTimeout(validatePin, 150);
      }
    });
  }

  // Physical Keyboard for PIN entry
  window.addEventListener('keydown', (e) => {
    if (state.currentWindow === 'lock') {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        addPinDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        clearLastPinDigit();
      } else if (e.key === 'Enter') {
        if (state.currentPinInput.length === state.pinLength) {
          validatePin();
        }
      }
    } else if (state.currentWindow === 'dashboard') {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openEditorForNewLog();
      }
    }
  });


  // =========================================================================
  // WINDOW 2: DASHBOARD LOGIC (Left 3/4 Screen, Right 1/4 Screen)
  // =========================================================================
  function getFilteredAndSortedLogs() {
    let logs = window.StorageService.getLogs();

    // Filter by Search Query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      logs = logs.filter(log => {
        const title = (log.title || '').toLowerCase();
        const content = (log.content || '').toLowerCase();
        const hash = (log.hash || '').toLowerCase();
        return title.includes(q) || content.includes(q) || hash.includes(q);
      });
    }

    // Sort by Date
    logs.sort((a, b) => {
      const timeA = (a.time || '00:00').substring(0, 5);
      const timeB = (b.time || '00:00').substring(0, 5);
      const dateA = new Date(`${a.date}T${timeA}:00`).getTime() || 0;
      const dateB = new Date(`${b.date}T${timeB}:00`).getTime() || 0;
      return state.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return logs;
  }

  function renderDashboard() {
    try {
      updateStorageUI();
      const allLogs = window.StorageService.getLogs() || [];
      const filteredLogs = getFilteredAndSortedLogs() || [];

      // Update Stats
      const totalWords = allLogs.reduce((acc, log) => acc + ((log && log.words) || 0), 0);
      if (el.statTotalLogs) el.statTotalLogs.textContent = allLogs.length;
      if (el.statTotalWords) el.statTotalWords.textContent = totalWords.toLocaleString();

      // Update Showing count
      if (el.logCountIndicator) {
        el.logCountIndicator.textContent = `Showing ${filteredLogs.length} of ${allLogs.length} Logs`;
      }

      // Render Table Rows
      if (!el.logListContainer) return;
      el.logListContainer.innerHTML = '';

      if (filteredLogs.length === 0) {
        el.logListContainer.innerHTML = `
          <div class="p-12 text-center flex flex-col items-center justify-center text-on-surface-variant font-mono text-sm">
            <span class="material-symbols-outlined text-[48px] text-outline mb-2">article</span>
            <p class="font-semibold text-white">No Logs Found</p>
            <p class="text-xs text-outline mt-1 max-w-sm">
              ${state.searchQuery ? `No logs match "${escapeHtml(state.searchQuery)}". Try another query.` :
                window.StorageService.notesDirectory ? 'Your journal is currently empty. Click "New Log" to create your first entry.' :
                  'No published notes are available. Add Markdown files to the project notes folder and rebuild, or select a local folder to write.'}
            </p>
            ${!state.searchQuery ? `
              <button type="button" class="mt-4 px-4 py-2 rounded-lg bg-primary text-on-primary font-bold text-xs" onclick="document.getElementById('btn-new-log').click()">
                + Write First Log
              </button>
            ` : ''}
          </div>
        `;
        updateSelectionUI();
        return;
      }

      filteredLogs.forEach(log => {
        if (!log) return;
        const isSelected = state.selectedLogIds.has(log.id);
        const row = document.createElement('div');
        row.className = `log-row group cursor-pointer grid grid-cols-12 gap-2 sm:gap-3 px-4 py-3.5 items-center transition-all ${isSelected ? 'selected' : ''}`;
        row.setAttribute('data-id', log.id || '');

        // Clean snippet for preview
        const rawContent = String(log.content || '');
        const cleanSnippet = rawContent
          .replace(/^[#>-]+\s*/gm, '')
          .replace(/[*_`]/g, '')
          .trim()
          .substring(0, 95) + '...';

        // Format time to HH:MM (no seconds)
        const displayTime = (log.time || '00:00').substring(0, 5);

        row.innerHTML = `
          <!-- Col 1: Mark Checkbox -->
          <div class="col-span-1 flex items-center gap-2 row-checkbox-cell">
            <input type="checkbox" class="row-selector w-4 h-4 rounded bg-surface-container-lowest accent-primary cursor-pointer" data-id="${escapeHtml(log.id)}" ${isSelected ? 'checked' : ''}>
          </div>

          <!-- Col 2: Timestamp (HH:MM and yy/mm/dd) -->
          <div class="col-span-3 sm:col-span-2 flex flex-col min-w-0">
            <span class="font-mono text-xs text-secondary truncate">${escapeHtml(displayTime)}</span>
            <span class="font-mono text-[11px] text-outline">${escapeHtml(formatDisplayDate(log.date || ''))}</span>
          </div>

          <!-- Col 3: Scope & Digest -->
          <div class="col-span-5 sm:col-span-6 flex flex-col min-w-0 pr-2">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-primary shrink-0"></span>
              <span class="font-semibold text-white text-sm truncate group-hover:text-primary transition-colors">${escapeHtml(log.title || 'Untitled')}</span>
            </div>
            <p class="font-sans text-xs text-on-surface-variant truncate mt-0.5">${escapeHtml(cleanSnippet)}</p>
          </div>

          <!-- Col 4: Words & Size -->
          <div class="hidden sm:flex sm:col-span-2 flex-col items-end justify-center font-mono text-xs text-on-surface-variant">
            <span class="text-white">${log.words || 0} w</span>
            <span class="text-[10px] text-outline">${escapeHtml(log.size || '0 KB')}</span>
          </div>

          <!-- Col 5: Digest / Signature -->
          <div class="col-span-3 sm:col-span-1 flex items-center justify-end font-mono text-xs text-secondary/80">
            <span class="truncate max-w-[65px]" title="${escapeHtml(log.hash || '')}">${escapeHtml((log.hash || '0x00').substring(0, 6))}..</span>
          </div>
        `;

        // Checkbox click
        const checkbox = row.querySelector('.row-selector');
        if (checkbox) {
          checkbox.disabled = !window.StorageService.notesDirectory;
          checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLogSelection(log.id, checkbox.checked);
          });
        }

        // Clicking row opens Window 3 to view & modify log
        row.addEventListener('click', () => {
          openEditorForLog(log.id);
        });

        el.logListContainer.appendChild(row);
      });

      updateSelectionUI();
    } catch (err) {
      console.error('Error rendering dashboard:', err);
    }
  }

  function toggleLogSelection(id, forcedState = null) {
    if (forcedState !== null) {
      if (forcedState) state.selectedLogIds.add(id);
      else state.selectedLogIds.delete(id);
    } else {
      if (state.selectedLogIds.has(id)) state.selectedLogIds.delete(id);
      else state.selectedLogIds.add(id);
    }

    const row = el.logListContainer.querySelector(`.log-row[data-id="${id}"]`);
    if (row) {
      const isSelected = state.selectedLogIds.has(id);
      row.classList.toggle('selected', isSelected);
      const cb = row.querySelector('.row-selector');
      if (cb) cb.checked = isSelected;
    }

    updateSelectionUI();
  }

  function updateSelectionUI() {
    const count = state.selectedLogIds.size;
    const totalRendered = el.logListContainer ? el.logListContainer.querySelectorAll('.log-row').length : 0;

    // Counter Badge on Button 2: "Select Log"
    if (el.selectedCounterBadge) {
      el.selectedCounterBadge.textContent = `${count} Active`;
      if (count > 0) {
        el.selectedCounterBadge.className = 'font-mono text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/40 font-bold';
      } else {
        el.selectedCounterBadge.className = 'font-mono text-xs px-2 py-0.5 rounded-full bg-surface-container text-outline';
      }
    }

    // Show/hide Selection Action Bar
    if (el.selectionActionBar) {
      if (state.selectMode || count > 0) {
        el.selectionActionBar.classList.remove('hidden');
        if (el.selectionCountText) el.selectionCountText.textContent = count;
      } else {
        el.selectionActionBar.classList.add('hidden');
      }
    }

    // Select All Checkbox state
    if (el.selectAllCheckbox) {
      if (totalRendered > 0 && count === totalRendered) {
        el.selectAllCheckbox.checked = true;
        el.selectAllCheckbox.indeterminate = false;
      } else if (count > 0) {
        el.selectAllCheckbox.checked = false;
        el.selectAllCheckbox.indeterminate = true;
      } else {
        el.selectAllCheckbox.checked = false;
        el.selectAllCheckbox.indeterminate = false;
      }
    }
  }

  // Dashboard Action Handlers
  if (el.btnNewLog) {
    el.btnNewLog.addEventListener('click', openEditorForNewLog);
  }

  if (el.btnSelectLog) {
    el.btnSelectLog.addEventListener('click', () => {
      state.selectMode = !state.selectMode;
      if (state.selectMode) {
        el.btnSelectLog.classList.add('border-secondary', 'bg-secondary/10');
        updateSelectionUI();
        showToast('Select mode active. Click any log checkbox or Select All.');
      } else {
        el.btnSelectLog.classList.remove('border-secondary', 'bg-secondary/10');
        state.selectedLogIds.clear();
        renderDashboard();
      }
    });
  }

  if (el.selectAllCheckbox) {
    el.selectAllCheckbox.addEventListener('change', (e) => {
      const checkAll = e.target.checked;
      const renderedRows = el.logListContainer.querySelectorAll('.log-row');
      renderedRows.forEach(row => {
        const id = row.getAttribute('data-id');
        if (id) {
          if (checkAll) state.selectedLogIds.add(id);
          else state.selectedLogIds.delete(id);
          const cb = row.querySelector('.row-selector');
          if (cb) cb.checked = checkAll;
          row.classList.toggle('selected', checkAll);
        }
      });
      state.selectMode = checkAll;
      updateSelectionUI();
    });
  }

  if (el.btnSelectAllInline) {
    el.btnSelectAllInline.addEventListener('click', () => {
      const renderedRows = el.logListContainer.querySelectorAll('.log-row');
      renderedRows.forEach(row => {
        const id = row.getAttribute('data-id');
        if (id) {
          state.selectedLogIds.add(id);
          const cb = row.querySelector('.row-selector');
          if (cb) cb.checked = true;
          row.classList.add('selected');
        }
      });
      updateSelectionUI();
    });
  }

  if (el.btnClearSelection) {
    el.btnClearSelection.addEventListener('click', () => {
      state.selectedLogIds.clear();
      state.selectMode = false;
      if (el.btnSelectLog) el.btnSelectLog.classList.remove('border-secondary', 'bg-secondary/10');
      renderDashboard();
    });
  }

  if (el.btnDeleteSelected) {
    el.btnDeleteSelected.addEventListener('click', () => {
      if (state.selectedLogIds.size === 0) {
        showToast('Please select at least one log to delete', 'warn');
        return;
      }
      openDeleteConfirmationModal(Array.from(state.selectedLogIds));
    });
  }

  if (el.logSearchInput) {
    el.logSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderDashboard();
    });
  }

  if (el.btnToggleSort) {
    el.btnToggleSort.addEventListener('click', () => {
      if (state.sortOrder === 'desc') {
        state.sortOrder = 'asc';
        if (el.sortLabel) el.sortLabel.textContent = 'Date (Asc)';
        if (el.sortIcon) el.sortIcon.textContent = 'arrow_upward';
      } else {
        state.sortOrder = 'desc';
        if (el.sortLabel) el.sortLabel.textContent = 'Date (Desc)';
        if (el.sortIcon) el.sortIcon.textContent = 'arrow_downward';
      }
      renderDashboard();
    });
  }

  if (el.btnRefreshLogs) {
    el.btnRefreshLogs.addEventListener('click', () => {
      runStorageAction(async () => {
        await window.StorageService.refreshNotesFolder();
        showToast('Logs refreshed');
      });
    });
  }

  if (el.btnSelectNotesFolder) {
    el.btnSelectNotesFolder.addEventListener('click', () => runStorageAction(async () => {
      await window.StorageService.selectNotesFolder();
      state.selectedLogIds.clear();
      state.selectMode = false;
      showToast('Notes folder connected');
    }));
  }

  if (el.btnLockVault) {
    el.btnLockVault.addEventListener('click', () => {
      showToast('Vault locked');
      showWindow('lock');
    });
  }


  // =========================================================================
  // WINDOW 3: LOG EDITOR & VIEWER LOGIC
  // =========================================================================
  function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
  }

  function formatDisplayDate(isoDate) {
    return isoDate.replace(/^\d{2}(\d{2})-(\d{2})-(\d{2})$/, '$1/$2/$3');
  }

  function setEditorDate(isoDate) {
    if (el.editorDate) el.editorDate.value = formatDisplayDate(isoDate);
    if (el.editorDatePicker) el.editorDatePicker.value = isoDate;
  }

  function readEditorDate() {
    const match = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(el.editorDate.value.trim());
    const errorMessage = 'Enter a valid date in yy/mm/dd format (for example, 26/10/25).';
    if (!match) throw new Error(errorMessage);
    // Preserve the note's century when editing a two-digit year.
    const reference = el.editorDatePicker.value || getTodayDateString();
    const isoDate = `${reference.slice(0, 2)}${match[1]}-${match[2]}-${match[3]}`;
    const parsed = new Date(`${isoDate}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== isoDate) {
      throw new Error(errorMessage);
    }
    return isoDate;
  }

  function getCurrentTimeString() {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function openEditorForNewLog() {
    return runStorageAction(async () => {
      const savedLog = await window.StorageService.saveLog({
        title: 'Untitled Log',
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        content: ''
      });
      state.selectedLogIds.clear();
      state.selectMode = false;
      openEditorForLog(savedLog.id);
      showToast('Markdown file created in the notes folder');
    });
  }

  function openEditorForLog(id) {
    const log = window.StorageService.getLogById(id);
    if (!log) {
      showToast('Log not found in storage', 'error');
      return;
    }

    state.currentEditingLogId = log.id;
    state.isDirty = false;

    if (el.editorActiveId) el.editorActiveId.textContent = log.id;
    if (el.editorTitleInput) el.editorTitleInput.value = log.title || '';
    setEditorDate(log.date || getTodayDateString());
    if (el.editorTime) el.editorTime.value = (log.time || '').substring(0, 5) || getCurrentTimeString();
    if (el.editorTextarea) el.editorTextarea.value = log.content || '';
    if (el.autosaveStatus) {
      el.autosaveStatus.innerHTML = `
        <span class="material-symbols-outlined text-primary text-[14px]">check_circle</span>
        <span>${window.StorageService.notesDirectory ? 'Saved' : 'Published - read-only'}</span>
      `;
    }

    if (el.btnEditorDelete) el.btnEditorDelete.classList.remove('hidden');
    updateStorageUI();

    updateWordCount();
    setEditorMode('raw');
    showWindow('editor');
  }

  function saveCurrentLog() {
    return runStorageAction(async () => {
      const title = (el.editorTitleInput ? el.editorTitleInput.value.trim() : '') || 'Untitled Log';
      const date = readEditorDate();
      const timeVal = (el.editorTime ? el.editorTime.value : '') || getCurrentTimeString();
      const time = timeVal.substring(0, 5);
      const content = el.editorTextarea ? el.editorTextarea.value : '';

      const savedLog = await window.StorageService.saveLog({
        id: state.currentEditingLogId,
        title,
        date,
        time,
        content
      });

      state.currentEditingLogId = savedLog.id;
      state.isDirty = false;
      setEditorDate(savedLog.date);
      if (el.editorActiveId) el.editorActiveId.textContent = savedLog.id;
      if (el.btnEditorDelete) el.btnEditorDelete.classList.remove('hidden');

      if (el.autosaveStatus) {
        el.autosaveStatus.innerHTML = `
          <span class="material-symbols-outlined text-primary text-[14px]">check_circle</span>
          <span>Saved to Markdown file</span>
        `;
      }

      showToast(`Log "${title.substring(0, 24)}..." saved!`);
    });
  }

  function updateWordCount() {
    const text = el.editorTextarea ? el.editorTextarea.value || '' : '';
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;

    if (el.editorWordCount) el.editorWordCount.textContent = words;
    if (el.editorCharCount) el.editorCharCount.textContent = chars;
  }

  // Render Markdown safely
  function renderMarkdown() {
    if (!el.markdownRenderTarget) return;
    const raw = el.editorTextarea ? el.editorTextarea.value || '*No content entered.*' : '*No content entered.*';
    if (window.marked && typeof window.marked.parse === 'function') {
      el.markdownRenderTarget.innerHTML = window.marked.parse(raw);
    } else {
      el.markdownRenderTarget.innerHTML = simpleMarkdownFallback(raw);
    }
  }

  function simpleMarkdownFallback(md) {
    let html = escapeHtml(md);
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/\n\n/gim, '<p></p>');
    return html;
  }

  // Editor View Modes: 'raw' | 'dual' | 'rendered'
  function setEditorMode(mode) {
    state.editorMode = mode;
    updateEditorModeUI();
  }

  function updateEditorModeUI() {
    const isRaw = state.editorMode === 'raw';
    const isDual = state.editorMode === 'dual';
    const isRendered = state.editorMode === 'rendered';

    if (el.tabModeRaw) {
      el.tabModeRaw.className = isRaw ? 'px-2.5 py-1 rounded-md bg-surface-container text-white font-bold' : 'px-2.5 py-1 rounded-md text-on-surface-variant hover:text-white';
    }
    if (el.tabModeDual) {
      el.tabModeDual.className = isDual ? 'px-2.5 py-1 rounded-md bg-surface-container text-white font-bold' : 'px-2.5 py-1 rounded-md text-on-surface-variant hover:text-white';
    }
    if (el.tabModeRendered) {
      el.tabModeRendered.className = isRendered ? 'px-2.5 py-1 rounded-md bg-surface-container text-white font-bold' : 'px-2.5 py-1 rounded-md text-on-surface-variant hover:text-white';
    }

    if (isRaw) {
      if (el.editorRawPane) el.editorRawPane.classList.remove('hidden');
      if (el.editorPreviewPane) el.editorPreviewPane.classList.add('hidden');
    } else if (isDual) {
      if (el.editorRawPane) el.editorRawPane.classList.remove('hidden');
      if (el.editorPreviewPane) el.editorPreviewPane.classList.remove('hidden');
      renderMarkdown();
    } else if (isRendered) {
      if (el.editorRawPane) el.editorRawPane.classList.add('hidden');
      if (el.editorPreviewPane) el.editorPreviewPane.classList.remove('hidden');
      renderMarkdown();
    }
  }

  if (el.tabModeRaw) el.tabModeRaw.addEventListener('click', () => setEditorMode('raw'));
  if (el.tabModeDual) el.tabModeDual.addEventListener('click', () => setEditorMode('dual'));
  if (el.tabModeRendered) el.tabModeRendered.addEventListener('click', () => setEditorMode('rendered'));

  // Editor Inputs
  function markEditorDirty() {
    state.isDirty = true;
    if (el.autosaveStatus) {
      el.autosaveStatus.innerHTML = `
        <span class="material-symbols-outlined text-secondary text-[14px]">edit</span>
        <span>Unsaved Changes</span>
      `;
    }
  }

  if (el.editorTextarea) {
    el.editorTextarea.addEventListener('input', () => {
      markEditorDirty();
      updateWordCount();
      if (state.editorMode === 'dual') {
        renderMarkdown();
      }
    });
  }

  if (el.editorTitleInput) {
    el.editorTitleInput.addEventListener('input', markEditorDirty);
  }

  if (el.editorDate) {
    el.editorDate.addEventListener('input', markEditorDirty);
  }

  if (el.editorDatePicker) {
    el.editorDatePicker.addEventListener('change', () => {
      setEditorDate(el.editorDatePicker.value);
      markEditorDirty();
    });
  }

  // Current button sets date and HH:MM to now
  if (el.btnEditorNow) {
    el.btnEditorNow.addEventListener('click', () => {
      setEditorDate(getTodayDateString());
      if (el.editorTime) el.editorTime.value = getCurrentTimeString();
      markEditorDirty();
      showToast('Timestamp set to current time');
    });
  }

  if (el.btnEditorSave) el.btnEditorSave.addEventListener('click', saveCurrentLog);

  if (el.btnEditorDiscard) {
    el.btnEditorDiscard.addEventListener('click', () => {
      if (state.isDirty) {
        if (!confirm('You have unsaved changes. Discard and return to dashboard?')) {
          return;
        }
      }
      showWindow('dashboard');
    });
  }

  if (el.btnBackToDashboard) {
    el.btnBackToDashboard.addEventListener('click', () => {
      if (state.isDirty) {
        if (!confirm('You have unsaved changes. Return to dashboard?')) {
          return;
        }
      }
      showWindow('dashboard');
    });
  }

  if (el.btnEditorDelete) {
    el.btnEditorDelete.addEventListener('click', () => {
      if (state.currentEditingLogId) {
        openDeleteConfirmationModal([state.currentEditingLogId]);
      }
    });
  }

  // Formatting Toolbar Buttons
  el.toolbarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      applyMarkdownCommand(cmd);
    });
  });

  function applyMarkdownCommand(cmd) {
    if (!el.editorTextarea) return;
    const textarea = el.editorTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);

    let replacement = '';

    switch (cmd) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        break;
      case 'heading':
        replacement = `\n### ${selected || 'Section Title'}\n`;
        break;
      case 'code':
        replacement = `\`${selected || 'code'}\``;
        break;
      case 'codeblock':
        replacement = `\n\`\`\`\n${selected || '// notes'}\n\`\`\`\n`;
        break;
      case 'list':
        replacement = `\n- ${selected || 'List item'}\n`;
        break;
      case 'quote':
        replacement = `\n> ${selected || 'Thought or reflection'}\n`;
        break;
      default:
        return;
    }

    textarea.setRangeText(replacement, start, end, 'end');
    state.isDirty = true;
    updateWordCount();
    if (state.editorMode !== 'raw') renderMarkdown();
    textarea.focus();
  }

  // Insert Timestamp Button
  if (el.btnInsertTimestamp) {
    el.btnInsertTimestamp.addEventListener('click', () => {
      if (!el.editorTextarea) return;
      const stamp = `\n\`[${formatDisplayDate(getTodayDateString())} ${getCurrentTimeString()}]\` `;
      const textarea = el.editorTextarea;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.setRangeText(stamp, start, end, 'end');
      state.isDirty = true;
      updateWordCount();
      if (state.editorMode !== 'raw') renderMarkdown();
      textarea.focus();
    });
  }


  // =========================================================================
  // MODAL: CONFIRM DELETE (Single & Multiple Logs)
  // =========================================================================
  function openDeleteConfirmationModal(ids) {
    state.pendingDeleteIds = ids;
    const count = ids.length;

    if (count === 1) {
      const log = window.StorageService.getLogById(ids[0]);
      const title = log ? log.title : 'this entry';
      if (el.deleteModalDescription) {
        el.deleteModalDescription.innerHTML = `Are you sure you want to permanently delete the log <strong>"${escapeHtml(title)}"</strong>?`;
      }
    } else {
      if (el.deleteModalDescription) {
        el.deleteModalDescription.innerHTML = `Are you sure you want to permanently delete <strong>${count} selected daily logs</strong>?`;
      }
    }

    if (el.modalConfirmDelete) {
      el.modalConfirmDelete.classList.remove('hidden');
      el.modalConfirmDelete.classList.add('flex');
    }
  }

  function closeDeleteConfirmationModal() {
    state.pendingDeleteIds = [];
    if (el.modalConfirmDelete) {
      el.modalConfirmDelete.classList.add('hidden');
      el.modalConfirmDelete.classList.remove('flex');
    }
  }

  if (el.btnCancelDelete) el.btnCancelDelete.addEventListener('click', closeDeleteConfirmationModal);

  if (el.btnConfirmDelete) {
    el.btnConfirmDelete.addEventListener('click', () => runStorageAction(async () => {
      if (state.pendingDeleteIds.length > 0) {
        const count = await window.StorageService.deleteLogs(state.pendingDeleteIds);

        if (state.pendingDeleteIds.includes(state.currentEditingLogId)) {
          state.currentEditingLogId = null;
          state.isDirty = false;
          showWindow('dashboard');
        }

        state.selectedLogIds.clear();
        state.selectMode = false;
        closeDeleteConfirmationModal();
        renderDashboard();
        showToast(`${count} log(s) deleted`);
      }
    }));
  }


  // =========================================================================
  // GLOBAL SHORTCUTS & MODAL ESCAPE
  // =========================================================================
  window.addEventListener('keydown', (e) => {
    if (state.storageBusy) return;
    if (e.key === 'Escape') {
      if (el.modalConfirmDelete && !el.modalConfirmDelete.classList.contains('hidden')) {
        closeDeleteConfirmationModal();
      }
    }
  });


  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  function init() {
    // Start at Window 1 (Lock Screen)
    showWindow('lock');
    updateStorageUI();
    runStorageAction(() => window.StorageService.loadPublishedNotes());
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
