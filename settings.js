document.addEventListener('DOMContentLoaded', () => {
    const autoUpdateCheck = document.getElementById('auto-update-check');
    const saveBtn = document.getElementById('save-settings');
    const cancelBtn = document.getElementById('cancel-settings');
  
    if (!autoUpdateCheck || !saveBtn || !cancelBtn) {
      console.error('Settings elements not found. Check your HTML structure.');
      return;
    }
  
    window.electronAPI.getSettings().then(settings => {
      autoUpdateCheck.checked = settings.autoUpdate || false;
  
      if (settings.autoUpdate) {
        window.electronAPI.checkForUpdates().then(({ currentVersion, latestVersion, downloadUrl }) => {
          if (latestVersion && compareVersions(latestVersion, currentVersion) > 0) {
            const updateModal = document.getElementById('update-modal');
            const updateMessage = document.getElementById('update-message');
            const updateYes = document.getElementById('update-yes');
            const updateNo = document.getElementById('update-no');
  
            updateMessage.textContent = `Вышла новая версия ${latestVersion}, хотите обновить?`;
            updateModal.style.display = 'block';
  
            updateYes.addEventListener('click', () => {
              window.electronAPI.openExternalLink(downloadUrl || 'https://github.com/BerkutSolutions/Berkut-Steganography-Studio/releases/latest');
              updateModal.style.display = 'none';
            });
  
            updateNo.addEventListener('click', () => {
              updateModal.style.display = 'none';
            });
          }
        });
      }
    });
  
    saveBtn.addEventListener('click', () => {
      window.electronAPI.saveSettings({ autoUpdate: autoUpdateCheck.checked });
      alert('Настройки сохранены');
    });
  
    cancelBtn.addEventListener('click', () => {
      switchTab('hide-panel', 'hide-tab');
    });
  
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
  
    function compareVersions(v1, v2) {
      const parseVersion = (version) => {
        const [mainPart, suffix = ''] = version.split('-');
        const parts = mainPart.split('.').map(Number);
        return { parts, suffix };
      };
  
      const version1 = parseVersion(v1);
      const version2 = parseVersion(v2);
  
      const maxLength = Math.max(version1.parts.length, version2.parts.length);
      for (let i = 0; i < maxLength; i++) {
        const part1 = version1.parts[i] || 0;
        const part2 = version2.parts[i] || 0;
        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
      }
  
      if (version1.suffix && !version2.suffix) return -1;
      if (!version1.suffix && version2.suffix) return 1;
      if (version1.suffix && version2.suffix) {
        return version1.suffix.localeCompare(version2.suffix);
      }
      return 0;
    }
  });