document.addEventListener('DOMContentLoaded', () => {
    switchTab('hide-panel', 'hide-tab');
  
    document.getElementById('hide-tab').addEventListener('click', () => switchTab('hide-panel', 'hide-tab'));
    document.getElementById('extract-tab').addEventListener('click', () => switchTab('extract-panel', 'extract-tab'));
    document.getElementById('metadata-tab').addEventListener('click', () => switchTab('metadata-panel', 'metadata-tab'));
  
    function switchTab(panelId, buttonId) {
      document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.style.display = 'none';
      });
      const activePanel = document.getElementById(panelId);
      activePanel.style.display = 'block';
      setActiveSidebarButton(buttonId);
    }
  
    function setActiveSidebarButton(activeId) {
      document.querySelectorAll('.sidebar-button').forEach((btn) => {
        btn.classList.remove('active');
      });
      document.getElementById(activeId).classList.add('active');
    }
  
    const carrierInput = document.getElementById('carrier-file');
    const fileTypeSelect = document.getElementById('file-type');
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
  });