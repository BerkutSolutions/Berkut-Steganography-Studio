document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');

  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      container.classList.add('minimize-animation');
      setTimeout(() => {
        window.electronAPI.minimizeWindow();
        container.classList.remove('minimize-animation');
      }, 400);
    });
  }

  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', () => {
      container.classList.add('maximize-animation');
      setTimeout(() => {
        window.electronAPI.maximizeWindow();
        container.classList.remove('maximize-animation');
      }, 350);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      container.classList.add('close-animation');
      setTimeout(() => {
        window.electronAPI.closeWindow();
      }, 200);
    });
  }

  if (window.electronAPI.onWindowMaximized) {
    window.electronAPI.onWindowMaximized(() => {
      container.classList.add('maximized');
    });
  }

  if (window.electronAPI.onWindowUnmaximized) {
    window.electronAPI.onWindowUnmaximized(() => {
      container.classList.remove('maximized');
    });
  }

  if (window.electronAPI.onWindowRestored) {
    window.electronAPI.onWindowRestored(() => {
      container.classList.add('restore-animation');
      setTimeout(() => {
        container.classList.remove('restore-animation');
      }, 400);
    });
  }

  const hideTab = document.getElementById('hide-tab');
  const extractTab = document.getElementById('extract-tab');
  const metadataTab = document.getElementById('metadata-tab');
  const settingsTab = document.getElementById('settings-tab');

  if (!hideTab || !extractTab || !metadataTab || !settingsTab) {
    console.error('One or more sidebar buttons not found. Check your HTML structure.');
    return;
  }

  switchTab('hide-panel', 'hide-tab');

  hideTab.addEventListener('click', () => switchTab('hide-panel', 'hide-tab'));
  extractTab.addEventListener('click', () => switchTab('extract-panel', 'extract-tab'));
  metadataTab.addEventListener('click', () => switchTab('metadata-panel', 'metadata-tab'));
  settingsTab.addEventListener('click', () => switchTab('settings-panel', 'settings-tab'));

  function switchTab(panelId, buttonId) {
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.style.display = 'none';
    });
    const activePanel = document.getElementById(panelId);
    if (activePanel) {
      activePanel.style.display = 'block';
      setActiveSidebarButton(buttonId);
    } else {
      console.error(`Panel with ID ${panelId} not found.`);
    }
  }

  function setActiveSidebarButton(activeId) {
    document.querySelectorAll('.sidebar-button').forEach((btn) => {
      btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) {
      activeBtn.classList.add('active');
    } else {
      console.error(`Button with ID ${activeId} not found.`);
    }
  }

  const carrierInput = document.getElementById('carrier-file');
  const fileTypeSelect = document.getElementById('file-type');
  if (carrierInput && fileTypeSelect) {
    carrierInput.accept = 'image/*';

    fileTypeSelect.addEventListener('change', (e) => {
      const type = e.target.value;
      const acceptMap = {
        image: '.png,.jpg,.jpeg,.bmp,.tiff',
        audio: '.mp3,.wav,.ogg,.flac',
        video: '.mp4,.avi,.mkv,.mov',
        docx: '.docx',
        pdf: '.pdf'
      };
      carrierInput.accept = acceptMap[type] || '*/*';
      carrierInput.value = '';
      const fileNameSpan = carrierInput.closest('.file-input-container')?.querySelector('.file-name');
      if (fileNameSpan) {
        fileNameSpan.textContent = 'Файл не выбран';
      }
    });
  }

  document.getElementsByName('input-mode').forEach((radio) => {
    radio.addEventListener('change', () => {
      const mode = document.querySelector('input[name="input-mode"]:checked').value;
      document.getElementById('secret-text').disabled = mode === 'file';
      document.getElementById('secret-file').disabled = mode === 'message';
      document.getElementById('secret-file-section').style.display = mode === 'message' ? 'none' : 'block';
      document.getElementById('message-section').style.display = mode === 'file' ? 'none' : 'block';
    });
  });

  document.querySelectorAll('.file-input').forEach((input) => {
    input.addEventListener('change', (event) => {
      const fileNameSpan = event.target.closest('.file-input-container')?.querySelector('.file-name');
      if (fileNameSpan) {
        fileNameSpan.textContent = event.target.files.length > 0 ? event.target.files[0].name : 'Файл не выбран';
      }
    });
  });

  const updateModal = document.getElementById('update-modal');
  const updateMessage = document.getElementById('update-message');
  const updateYes = document.getElementById('update-yes');
  const updateNo = document.getElementById('update-no');

  window.electronAPI.onUpdateAvailable((event, { version, downloadUrl }) => {
    updateMessage.textContent = `Вышла новая версия ${version}, хотите обновить?`;
    updateModal.style.display = 'block';

    updateYes.addEventListener('click', () => {
      window.electronAPI.openExternalLink(downloadUrl);
      updateModal.style.display = 'none';
    });

    updateNo.addEventListener('click', () => {
      updateModal.style.display = 'none';
    });
  });

  const updatePromptModal = document.getElementById('update-prompt-modal');
  const modalYes = document.getElementById('modal-yes');
  const modalNo = document.getElementById('modal-no');

  window.electronAPI.onShowUpdatePrompt(() => {
    updatePromptModal.style.display = 'block';
  });

  modalYes.addEventListener('click', () => {
    window.electronAPI.setInitialUpdateSetting(true);
    updatePromptModal.style.display = 'none';
  });

  modalNo.addEventListener('click', () => {
    window.electronAPI.setInitialUpdateSetting(false);
    updatePromptModal.style.display = 'none';
  });
});