/**
 * SatQuery-AI - Interactive Chat Dashboard with SQLite Conversation & Message Persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const welcomeHero = document.getElementById('welcomeHero');
  const messagesContainer = document.getElementById('messagesContainer');
  const chatViewport = document.getElementById('chatViewport');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const newChatBtn = document.getElementById('newChatBtn');
  const actionCards = document.querySelectorAll('.action-card');
  const chatHistoryList = document.getElementById('chatHistoryList');
  const emptyHistory = document.getElementById('emptyHistory');
  const searchChatBtn = document.getElementById('searchChatBtn');
  const searchBoxContainer = document.getElementById('searchBoxContainer');
  const searchHistoryInput = document.getElementById('searchHistoryInput');
  const micBtn = document.getElementById('micBtn');

  // File & Attachment Elements
  const btnUploadImage = document.getElementById('btnUploadImage');
  const btnUploadFile = document.getElementById('btnUploadFile');
  const fileInput = document.getElementById('fileInput');
  const attachmentsStrip = document.getElementById('attachmentsStrip');
  const slotA = document.getElementById('slotA');
  const slotB = document.getElementById('slotB');
  const previewImgA = document.getElementById('previewImgA');
  const previewImgB = document.getElementById('previewImgB');
  const removeSlotABtn = document.getElementById('removeSlotABtn');
  const removeSlotBBtn = document.getElementById('removeSlotBBtn');
  const attachmentModeTag = document.getElementById('attachmentModeTag');
  const modeTagText = document.getElementById('modeTagText');

  // User Dropdown & Sidebar Mobile Toggles
  const userMenuBtn = document.getElementById('userMenuBtn');
  const openSidebarBtn = document.getElementById('openSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  let attachedImages = [];
  let currentConversationId = null;
  let cachedConversations = [];
  let isSending = false;

  // ==========================================
  // Initialize: Load SQLite Conversations
  // ==========================================
  loadConversations();

  // ==========================================
  // Auto-Expanding Textarea
  // ==========================================
  if (chatInput) {
    chatInput.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 140) + 'px';
    });

    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  }

  // ==========================================
  // Search Box Toggle & Filter
  // ==========================================
  if (searchChatBtn && searchBoxContainer) {
    searchChatBtn.addEventListener('click', () => {
      const isHidden = searchBoxContainer.style.display === 'none';
      searchBoxContainer.style.display = isHidden ? 'block' : 'none';
      if (isHidden && searchHistoryInput) {
        searchHistoryInput.focus();
      }
    });
  }

  if (searchHistoryInput) {
    searchHistoryInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      filterConversations(query);
    });
  }

  // ==========================================
  // User Dropdown Toggle
  // ==========================================
  if (userMenuBtn) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenuBtn.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      userMenuBtn.classList.remove('open');
    });
  }

  // ==========================================
  // Mobile Sidebar Toggle
  // ==========================================
  if (openSidebarBtn) {
    openSidebarBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
    });
  }

  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
      if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarBackdrop.classList.remove('active');
    });
  }

  // ==========================================
  // Models, Datasets & Research Showcase Modal
  // ==========================================
  const showcaseModal = document.getElementById('showcaseModal');
  const showcaseCloseBtn = document.getElementById('showcaseCloseBtn');
  const navHome = document.getElementById('navHome');
  const navModels = document.getElementById('navModels');
  const navDatasets = document.getElementById('navDatasets');
  const navResearch = document.getElementById('navResearch');
  const showcaseTabs = document.querySelectorAll('.showcase-tab');
  const showcasePanes = document.querySelectorAll('.showcase-tab-pane');

  function openShowcaseModal(targetTabId = 'tabModels') {
    if (!showcaseModal) return;

    // Switch active tab
    showcaseTabs.forEach((tab) => {
      const isMatch = tab.getAttribute('data-tab') === targetTabId;
      tab.classList.toggle('active', isMatch);
    });

    showcasePanes.forEach((pane) => {
      const isMatch = pane.id === targetTabId;
      pane.classList.toggle('active', isMatch);
    });

    showcaseModal.classList.add('active');

    // Close mobile sidebar if open
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
  }

  function closeShowcaseModal() {
    if (!showcaseModal) return;
    showcaseModal.classList.remove('active');
  }

  if (navModels) {
    navModels.addEventListener('click', (e) => {
      e.preventDefault();
      openShowcaseModal('tabModels');
    });
  }

  if (navDatasets) {
    navDatasets.addEventListener('click', (e) => {
      e.preventDefault();
      openShowcaseModal('tabDatasets');
    });
  }

  if (navResearch) {
    navResearch.addEventListener('click', (e) => {
      e.preventDefault();
      openShowcaseModal('tabResearch');
    });
  }

  if (navHome) {
    navHome.addEventListener('click', (e) => {
      e.preventDefault();
      closeShowcaseModal();
      startNewChat();
    });
  }

  if (showcaseCloseBtn) {
    showcaseCloseBtn.addEventListener('click', closeShowcaseModal);
  }

  if (showcaseModal) {
    showcaseModal.addEventListener('click', (e) => {
      if (e.target === showcaseModal) closeShowcaseModal();
    });
  }

  showcaseTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      showcaseTabs.forEach((t) => t.classList.toggle('active', t === tab));
      showcasePanes.forEach((p) => p.classList.toggle('active', p.id === targetId));
    });
  });

  // ==========================================
  // Dual Image Attachment Handling
  // ==========================================
  if (btnUploadImage && fileInput) {
    btnUploadImage.addEventListener('click', () => fileInput.click());
  }

  if (btnUploadFile && fileInput) {
    btnUploadFile.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      const remainingSlots = 2 - attachedImages.length;
      if (remainingSlots <= 0) {
        alert('You can attach a maximum of 2 satellite images (Image A: Before/Optical, Image B: After/SAR).');
        return;
      }

      const filesToProcess = files.slice(0, remainingSlots);
      let readCount = 0;

      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onload = function (event) {
          attachedImages.push(event.target.result);
          readCount++;
          if (readCount === filesToProcess.length) {
            updateAttachmentsUI();
          }
        };
        reader.readAsDataURL(file);
      });

      fileInput.value = '';
    });
  }

  if (removeSlotABtn) {
    removeSlotABtn.addEventListener('click', () => {
      attachedImages.splice(0, 1);
      updateAttachmentsUI();
    });
  }

  if (removeSlotBBtn) {
    removeSlotBBtn.addEventListener('click', () => {
      attachedImages.splice(1, 1);
      updateAttachmentsUI();
    });
  }

  function updateAttachmentsUI() {
    if (!attachmentsStrip) return;

    if (attachedImages.length === 0) {
      attachmentsStrip.style.display = 'none';
      if (slotA) slotA.style.display = 'none';
      if (slotB) slotB.style.display = 'none';
    } else if (attachedImages.length === 1) {
      attachmentsStrip.style.display = 'flex';
      if (slotA) {
        slotA.style.display = 'block';
        if (previewImgA) previewImgA.src = attachedImages[0];
      }
      if (slotB) slotB.style.display = 'none';
      if (modeTagText) modeTagText.innerText = 'Single-Image Analysis';
    } else if (attachedImages.length >= 2) {
      attachmentsStrip.style.display = 'flex';
      if (slotA) {
        slotA.style.display = 'block';
        if (previewImgA) previewImgA.src = attachedImages[0];
      }
      if (slotB) {
        slotB.style.display = 'block';
        if (previewImgB) previewImgB.src = attachedImages[1];
      }
      if (modeTagText) modeTagText.innerText = 'Dual-Image (Change Detection / Fusion)';
    }
  }

  function clearAttachments() {
    attachedImages = [];
    updateAttachmentsUI();
    if (fileInput) fileInput.value = '';
  }


  // ==========================================
  // Voice Input (Web Speech API)
  // ==========================================
  if (micBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let isRecording = false;

    micBtn.addEventListener('click', () => {
      if (isRecording) {
        recognition.stop();
      } else {
        try {
          recognition.start();
          isRecording = true;
          micBtn.style.color = '#ef4444';
          micBtn.title = 'Listening... Speak now';
        } catch (err) {
          console.error('Speech recognition error:', err);
        }
      }
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (chatInput) {
        chatInput.value = (chatInput.value ? chatInput.value + ' ' : '') + transcript;
        chatInput.dispatchEvent(new Event('input'));
      }
    };

    recognition.onend = () => {
      isRecording = false;
      micBtn.style.color = '';
      micBtn.title = 'Voice query';
    };

    recognition.onerror = () => {
      isRecording = false;
      micBtn.style.color = '';
      micBtn.title = 'Voice query';
    };
  }

  // ==========================================
  // Quick Prompt Cards Click
  // ==========================================
  actionCards.forEach((card) => {
    card.addEventListener('click', () => {
      const prompt = card.getAttribute('data-prompt');
      if (chatInput) chatInput.value = prompt;
      sendMessage(prompt, attachedImages);
    });
  });

  // ==========================================
  // New Chat Button
  // ==========================================
  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
      startNewChat();
    });
  }

  function startNewChat() {
    currentConversationId = null;
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
      messagesContainer.style.display = 'none';
    }
    if (welcomeHero) welcomeHero.style.display = 'flex';
    if (chatInput) {
      chatInput.value = '';
      chatInput.style.height = 'auto';
    }
    clearAttachments();

    // Remove active state from all items
    document.querySelectorAll('.history-item').forEach((el) => el.classList.remove('active'));

    // Close mobile sidebar if open
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
  }

  // ==========================================
  // Form Submit / Message Sending
  // ==========================================
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (isSending) return;

      const text = chatInput ? chatInput.value.trim() : '';
      if (!text && attachedImages.length === 0) return;

      const imagesToSend = [...attachedImages];
      sendMessage(text, imagesToSend);

      if (chatInput) {
        chatInput.value = '';
        chatInput.style.height = 'auto';
      }
      clearAttachments();
    });
  }

  async function sendMessage(text, imageList = null) {
    if (isSending) return;
    isSending = true;

    // Switch view to messages container
    if (welcomeHero) welcomeHero.style.display = 'none';
    if (messagesContainer) messagesContainer.style.display = 'flex';

    // Normalize image list
    const imagesArray = Array.isArray(imageList) ? imageList : (imageList ? [imageList] : []);

    // Append User Message to UI immediately
    appendUserMessage(text, imagesArray);

    // Show AI Typing Indicator
    showTypingIndicator();
    scrollToBottom();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      let response;
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: text,
            images: imagesArray,
            image: imagesArray.length > 0 ? imagesArray[0] : null,
            conversation_id: currentConversationId
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      let data;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        data = {
          success: false,
          error: `Server returned HTTP ${response.status}. Please make sure 'python app.py' is running and refresh the page.`
        };
      }

      removeTypingIndicator();

      if (response.ok && data.success) {
        currentConversationId = data.conversation_id;
        const aiText = data.response || 'No response generated.';
        appendAiResponse(aiText, data.model, null, data.proof_image, data.agent_trace);

        // Refresh SQLite conversation list in sidebar
        loadConversations();
      } else {
        const errorMsg = data.error || 'Failed to reach the AI server. Please check your connection or Groq API key.';
        appendAiResponse(`⚠️ **Error:** ${errorMsg}`, 'error');
      }
    } catch (err) {
      removeTypingIndicator();
      let errorHint = err.name === 'AbortError'
        ? 'The request took too long to complete. The server is still running — please try sending your query again.'
        : `Could not connect to SatQuery-AI server. Please verify that 'python app.py' is running on port 5000. (${err.message})`;
      appendAiResponse(`⚠️ **Connection Error:** ${errorHint}`, 'error');
    } finally {
      isSending = false;
      scrollToBottom();
    }
  }

  // ==========================================
  // Conversations Database Management
  // ==========================================

  async function loadConversations() {
    try {
      const response = await fetch('/api/conversations');
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;

      const data = await response.json();
      if (response.ok && data.success) {
        cachedConversations = data.conversations || [];
        renderConversationList(cachedConversations);
      }
    } catch (err) {
      console.error('Error loading conversations from SQLite:', err);
    }
  }

  function renderConversationList(conversations) {
    if (!chatHistoryList) return;

    if (!conversations || conversations.length === 0) {
      chatHistoryList.innerHTML = `
        <div class="empty-history" id="emptyHistory">
          <i class="fa-regular fa-comments"></i>
          <p>No conversations yet.<br>Start a new satellite query!</p>
        </div>
      `;
      return;
    }

    let html = '';
    conversations.forEach((conv) => {
      const isActive = conv.id === currentConversationId ? 'active' : '';
      const iconData = getCategoryIcon(conv.title);
      const timeStr = formatRelativeTime(conv.updated_at || conv.created_at);
      const previewStr = conv.last_message ? escapeHtml(cleanMarkdownPreview(conv.last_message)) : 'New conversation';

      html += `
        <div class="history-item ${isActive}" data-chat-id="${conv.id}">
          <div class="item-icon ${iconData.colorClass}">
            <i class="${iconData.icon}"></i>
          </div>
          <div class="item-details">
            <div class="item-top">
              <span class="item-title" title="${escapeHtml(conv.title)}">${escapeHtml(conv.title)}</span>
              <span class="item-time">${timeStr}</span>
              <button class="history-item-delete" data-delete-id="${conv.id}" title="Delete chat">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
            <p class="item-preview">${previewStr}</p>
          </div>
        </div>
      `;
    });

    chatHistoryList.innerHTML = html;

    // Attach click and delete listeners
    chatHistoryList.querySelectorAll('.history-item').forEach((item) => {
      const convId = item.getAttribute('data-chat-id');
      item.addEventListener('click', (e) => {
        if (e.target.closest('.history-item-delete')) return;
        selectConversation(convId);
      });
    });

    chatHistoryList.querySelectorAll('.history-item-delete').forEach((btn) => {
      const convId = btn.getAttribute('data-delete-id');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteConversation(convId);
      });
    });
  }

  function filterConversations(query) {
    if (!query) {
      renderConversationList(cachedConversations);
      return;
    }
    const filtered = cachedConversations.filter((c) => {
      return (c.title && c.title.toLowerCase().includes(query)) ||
             (c.last_message && c.last_message.toLowerCase().includes(query));
    });
    renderConversationList(filtered);
  }

  async function selectConversation(convId) {
    currentConversationId = convId;

    // Update active UI in sidebar
    document.querySelectorAll('.history-item').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-chat-id') === convId);
    });

    // Close mobile sidebar
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');

    // Show messages container
    if (welcomeHero) welcomeHero.style.display = 'none';
    if (messagesContainer) {
      messagesContainer.style.display = 'flex';
      messagesContainer.innerHTML = '';
    }

    // Fetch messages from SQLite
    try {
      const res = await fetch(`/api/conversations/${convId}`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;

      const data = await res.json();
      if (res.ok && data.success) {
        const messages = data.messages || [];
        messages.forEach((msg) => {
          if (msg.role === 'user') {
            appendUserMessage(msg.content, msg.image_data, msg.created_at);
          } else {
            appendAiResponse(msg.content, msg.model, msg.created_at, msg.image_data);
          }
        });
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    }
  }

  async function deleteConversation(convId) {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const res = await fetch(`/api/conversations/${convId}`, {
        method: 'DELETE'
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;

      const data = await res.json();
      if (res.ok && data.success) {
        if (currentConversationId === convId) {
          startNewChat();
        }
        loadConversations();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }

  // ==========================================
  // Image Lightbox Modal Functions
  // ==========================================
  const imageLightbox = document.getElementById('imageLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');

  function openImageLightbox(src) {
    if (!imageLightbox || !lightboxImg) return;
    lightboxImg.src = src;
    imageLightbox.classList.add('active');
  }

  function closeImageLightbox() {
    if (!imageLightbox) return;
    imageLightbox.classList.remove('active');
    if (lightboxImg) lightboxImg.src = '';
  }

  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closeImageLightbox);
  }

  if (imageLightbox) {
    imageLightbox.addEventListener('click', (e) => {
      if (e.target === imageLightbox) closeImageLightbox();
    });
  }

  // ==========================================
  // DOM & Message Rendering Helpers
  // ==========================================

  function appendUserMessage(text, imageSrcOrArray, timestampStr = null) {
    const time = timestampStr ? formatTimeString(timestampStr) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgRow = document.createElement('div');
    userMsgRow.className = 'message-row user';

    // Parse image or images array
    let imgs = [];
    if (Array.isArray(imageSrcOrArray)) {
      imgs = imageSrcOrArray;
    } else if (typeof imageSrcOrArray === 'string' && imageSrcOrArray) {
      if (imageSrcOrArray.startsWith('[') || imageSrcOrArray.startsWith('{')) {
        try {
          const parsed = JSON.parse(imageSrcOrArray);
          imgs = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          imgs = [imageSrcOrArray];
        }
      } else {
        imgs = [imageSrcOrArray];
      }
    }

    let imgHtml = '';
    if (imgs.length === 1) {
      imgHtml = `<img src="${imgs[0]}" class="user-attachment-img" alt="Attached satellite scan" />`;
    } else if (imgs.length >= 2) {
      imgHtml = `
        <div class="user-attachments-grid">
          <div class="dual-attachment-card">
            <img src="${imgs[0]}" alt="Image A" />
            <div class="slot-tag-label">Image A (Before / Optical)</div>
          </div>
          <div class="dual-attachment-card">
            <img src="${imgs[1]}" alt="Image B" />
            <div class="slot-tag-label">Image B (After / SAR)</div>
          </div>
        </div>
      `;
    }

    let textHtml = text ? `<p>${escapeHtml(text)}</p>` : '';

    userMsgRow.innerHTML = `
      <div class="user-bubble">
        ${textHtml}
        ${imgHtml}
        <div style="font-size: 0.68rem; opacity: 0.7; text-align: right; margin-top: 4px;">${time}</div>
      </div>
    `;
    if (messagesContainer) messagesContainer.appendChild(userMsgRow);
  }


  function showTypingIndicator() {
    removeTypingIndicator();
    const typingRow = document.createElement('div');
    typingRow.className = 'message-row ai typing-row';
    typingRow.id = 'aiTypingRow';
    typingRow.innerHTML = `
      <div class="ai-avatar"><i class="fa-solid fa-satellite"></i></div>
      <div class="ai-bubble-content">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    if (messagesContainer) messagesContainer.appendChild(typingRow);
  }

  function removeTypingIndicator() {
    const typingRow = document.getElementById('aiTypingRow');
    if (typingRow) typingRow.remove();
  }

  function appendAiResponse(rawMarkdown, modelName = '', timestampStr = null, proofImage = null, agentTrace = null) {
    const time = timestampStr ? formatTimeString(timestampStr) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const aiMsgRow = document.createElement('div');
    aiMsgRow.className = 'message-row ai';

    let formattedHtml = '';
    if (window.marked && typeof window.marked.parse === 'function') {
      try {
        formattedHtml = window.marked.parse(rawMarkdown);
      } catch (e) {
        formattedHtml = `<p>${escapeHtml(rawMarkdown)}</p>`;
      }
    } else {
      formattedHtml = formatBasicMarkdown(rawMarkdown);
    }

    let modelBadge = modelName ? `<span style="font-size: 0.68rem; opacity: 0.6; margin-left: 6px;">[${escapeHtml(modelName)}]</span>` : '';

    // Agentic Workflow Pipeline Badge (Slide 3: Agentic Architecture)
    let agenticBadgeHtml = '';
    if (agentTrace) {
      const activeAgent = agentTrace.active_agent || 'Task Agent';
      const conf = agentTrace.confidence || '98%';
      agenticBadgeHtml = `
        <div class="agentic-workflow-container">
          <div class="agentic-pipeline-strip">
            <div class="pipeline-step done"><i class="fa-solid fa-cloud-arrow-up"></i> <span>Intake</span></div>
            <i class="fa-solid fa-chevron-right step-arrow"></i>
            <div class="pipeline-step done"><i class="fa-solid fa-network-wired"></i> <span>Classifier</span></div>
            <i class="fa-solid fa-chevron-right step-arrow"></i>
            <div class="pipeline-step active-agent"><i class="fa-solid fa-microchip"></i> <span>${escapeHtml(activeAgent)}</span></div>
            <i class="fa-solid fa-chevron-right step-arrow"></i>
            <div class="pipeline-step verified-step"><i class="fa-solid fa-shield-halved"></i> <span>${escapeHtml(conf)}</span></div>
            <button type="button" class="btn-toggle-trace" title="Inspect Multi-Agent Execution Trace"><i class="fa-solid fa-circle-info"></i></button>
          </div>
          <div class="agentic-trace-details" style="display: none;">
            <div class="trace-row"><span class="trace-label">Intake Agent:</span> <span class="trace-val">${escapeHtml(agentTrace.intake || 'Telemetry Ingested')}</span></div>
            <div class="trace-row"><span class="trace-label">Classifier Agent:</span> <span class="trace-val">${escapeHtml(agentTrace.classifier || 'Routed')}</span></div>
            <div class="trace-row"><span class="trace-label">Active Executor:</span> <span class="trace-val">${escapeHtml(agentTrace.intent_summary || activeAgent)}</span></div>
            <div class="trace-row"><span class="trace-label">Verification Agent:</span> <span class="trace-val">${escapeHtml(agentTrace.verification || 'Geospatial validation nominal')}</span></div>
          </div>
        </div>
      `;
    }

    let proofCardHtml = '';
    if (proofImage && typeof proofImage === 'string' && proofImage.startsWith('data:image')) {
      proofCardHtml = `
        <div class="ai-proof-card">
          <div class="proof-card-header">
            <div><i class="fa-solid fa-satellite-dish"></i> <span>AI Geospatial Proof & Computer Vision Evidence</span></div>
            <button type="button" class="btn-expand-proof" data-proof-src="${proofImage}"><i class="fa-solid fa-expand"></i> Expand</button>
          </div>
          <img src="${proofImage}" class="proof-image" alt="AI Visual Proof Evidence" data-proof-src="${proofImage}" />
        </div>
      `;
    }

    aiMsgRow.innerHTML = `
      <div class="ai-avatar"><i class="fa-solid fa-satellite"></i></div>
      <div class="ai-bubble-content">
        <div class="ai-header-meta">
          <span class="ai-name">SatQuery-AI</span>
          ${modelBadge}
          <span>•</span>
          <span>${time}</span>
        </div>
        ${agenticBadgeHtml}
        <div class="ai-markdown-body">
          ${formattedHtml}
        </div>
        ${proofCardHtml}
      </div>
    `;

    // Toggle Agentic Trace Details
    const toggleTraceBtn = aiMsgRow.querySelector('.btn-toggle-trace');
    const traceDetails = aiMsgRow.querySelector('.agentic-trace-details');
    if (toggleTraceBtn && traceDetails) {
      toggleTraceBtn.addEventListener('click', () => {
        const isHidden = traceDetails.style.display === 'none';
        traceDetails.style.display = isHidden ? 'flex' : 'none';
      });
    }

    // Render KaTeX Math / LaTeX formulas in the response
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(aiMsgRow, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false
        });
      } catch (e) {
        // Continue normally if formula parser throws
      }
    }

    // Attach click listeners for proof image expanding / lightbox
    aiMsgRow.querySelectorAll('.btn-expand-proof, .proof-image').forEach((el) => {
      el.addEventListener('click', () => {
        const src = el.getAttribute('data-proof-src');
        if (src) openImageLightbox(src);
      });
    });

    if (messagesContainer) messagesContainer.appendChild(aiMsgRow);
  }



  function cleanMarkdownPreview(text) {
    if (!text) return 'New conversation';
    return text
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2')
      .replace(/\$\$[\s\S]*?\$\$/g, '[Formula]')
      .replace(/\$[^$]+\$/g, '[Math]')
      .replace(/#{1,6}\s+/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-*+]\s+/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  }


  function scrollToBottom() {
    if (chatViewport) {
      chatViewport.scrollTo({
        top: chatViewport.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  function escapeHtml(string) {
    if (!string) return '';
    const div = document.createElement('div');
    div.innerText = string;
    return div.innerHTML;
  }

  function formatBasicMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
  }

  function getCategoryIcon(title = '') {
    const t = title.toLowerCase();
    if (t.includes('urban') || t.includes('city') || t.includes('building')) {
      return { icon: 'fa-solid fa-city', colorClass: 'text-cyan' };
    }
    if (t.includes('flood') || t.includes('water') || t.includes('river') || t.includes('sea') || t.includes('ocean')) {
      return { icon: 'fa-solid fa-water', colorClass: 'text-blue' };
    }
    if (t.includes('tree') || t.includes('forest') || t.includes('vegetation') || t.includes('crop') || t.includes('ndvi')) {
      return { icon: 'fa-solid fa-tree', colorClass: 'text-green' };
    }
    if (t.includes('change') || t.includes('detection') || t.includes('compare') || t.includes('temporal')) {
      return { icon: 'fa-solid fa-arrows-rotate', colorClass: 'text-purple' };
    }
    if (t.includes('terrain') || t.includes('elevation') || t.includes('mountain') || t.includes('ground')) {
      return { icon: 'fa-solid fa-mountain', colorClass: 'text-yellow' };
    }
    return { icon: 'fa-solid fa-satellite', colorClass: 'text-cyan' };
  }

  function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr.replace(' ', 'T') + 'Z');
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);

      if (diffMin < 2) return 'Just now';
      if (diffHr < 24 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (diffDays === 1 || (diffHr < 48 && date.getDate() === now.getDate() - 1)) {
        return 'Yesterday';
      }
      if (diffDays < 7) {
        return `${diffDays} days ago`;
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function formatTimeString(dateStr) {
    if (!dateStr) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      const date = new Date(dateStr.replace(' ', 'T') + 'Z');
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  }
});
