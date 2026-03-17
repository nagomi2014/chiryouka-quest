// 治療家クエスト ─ App Logic
const app = {
  state: {
    currentView: 'map',     // 'map' | 'world' | 'quest'
    currentWorldId: null,
    currentQuestId: null,
    completed: new Set(),    // Set of completed quest IDs
    checkmarks: {},          // { questId: true/false } for current quest checklist
  },

  // ─── Initialization ───
  init() {
    this.loadProgress();
    this.createParticles();
    this.renderMap();
    this.updateStatusBar();

    // Handle browser back/forward
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  // ─── Routing ───
  handleRoute() {
    const hash = location.hash.slice(1);
    if (!hash || hash === 'map') {
      this.showMap();
    } else if (hash.startsWith('world/')) {
      const worldId = parseInt(hash.split('/')[1]);
      this.showWorld(worldId);
    } else if (hash.startsWith('quest/')) {
      const questId = parseInt(hash.split('/')[1]);
      this.showQuest(questId);
    }
  },

  goBack() {
    sfx.back();
    if (this.state.currentView === 'quest') {
      location.hash = `world/${this.state.currentWorldId}`;
    } else if (this.state.currentView === 'world') {
      location.hash = 'map';
    }
  },

  // ─── View Switching ───
  switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${viewName}View`).classList.add('active');
    this.state.currentView = viewName;

    const backBtn = document.getElementById('backBtn');
    backBtn.classList.toggle('visible', viewName !== 'map');

    window.scrollTo(0, 0);
  },

  // ─── Map View ───
  showMap() {
    this.switchView('map');
    this.renderMap();
  },

  renderMap() {
    const container = document.getElementById('worldPath');
    container.innerHTML = '';

    WORLDS.forEach((world, index) => {
      const completed = this.getWorldProgress(world.id);
      const total = world.quests.length;
      const isComplete = completed === total;
      const isUnlocked = index === 0 || this.isWorldComplete(index);
      const isCurrent = isUnlocked && !isComplete;

      const card = document.createElement('div');
      card.className = `world-card ${isComplete ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`;
      card.onclick = () => {
        if (isUnlocked) {
          sfx.openWorld();
          location.hash = `world/${world.id}`;
        }
      };
      // ホバー音
      card.onmouseenter = () => { if (isUnlocked) sfx.hover(); };

      const progressPercent = total > 0 ? (completed / total * 100) : 0;

      card.innerHTML = `
        <div class="world-icon" style="background: ${world.bgGradient}">${world.icon}</div>
        <div class="world-info">
          <h3>WORLD ${world.id}: ${world.name}</h3>
          <div class="subtitle">${world.subtitle}</div>
        </div>
        <div class="world-progress">
          ${isComplete
            ? '<div class="world-check">✅</div>'
            : `
              <div class="world-progress-bar">
                <div class="world-progress-bar-fill" style="width: ${progressPercent}%; background: ${world.color}"></div>
              </div>
              <div class="world-progress-text">${completed}/${total}</div>
            `
          }
        </div>
      `;

      container.appendChild(card);
    });
  },

  // ─── World View ───
  showWorld(worldId) {
    this.state.currentWorldId = worldId;
    this.switchView('world');
    this.renderWorld(worldId);
    sfx.harryAppear();
  },

  renderWorld(worldId) {
    const world = WORLDS.find(w => w.id === worldId);
    if (!world) return;

    // Header
    const header = document.getElementById('worldHeader');
    header.style.background = world.bgGradient;
    header.innerHTML = `
      <div class="world-icon-large">${world.icon}</div>
      <h2>WORLD ${world.id}: ${world.name}</h2>
      <div class="subtitle">${world.subtitle}</div>
    `;

    // Harry dialogue
    const harry = document.getElementById('worldHarry');
    harry.innerHTML = `
      <div class="harry-dialogue">
        <div class="harry-avatar">🦔</div>
        <div class="harry-bubble">${world.harryIntro}</div>
      </div>
    `;

    // Description
    document.getElementById('worldDescription').textContent = world.description;

    // Quest list
    const list = document.getElementById('questList');
    list.innerHTML = '';

    world.quests.forEach((quest, index) => {
      const isCompleted = this.state.completed.has(quest.id);
      const prevCompleted = index === 0 || this.state.completed.has(world.quests[index - 1].id);
      const isUnlocked = prevCompleted || isCompleted;

      const item = document.createElement('div');
      item.className = `quest-item ${isCompleted ? 'completed' : ''} ${!isUnlocked ? 'locked' : ''} ${quest.isBoss ? 'boss' : ''}`;
      item.onclick = () => {
        if (isUnlocked) {
          sfx.click();
          location.hash = `quest/${quest.id}`;
        }
      };
      item.onmouseenter = () => { if (isUnlocked) sfx.hover(); };

      item.innerHTML = `
        <div class="quest-number">#${quest.id}</div>
        <div class="quest-status-icon">${isCompleted ? '✓' : quest.isBoss ? '💀' : ''}</div>
        <div class="quest-item-info">
          <h4>${quest.name}</h4>
          <div class="enemy-preview">👾 ${quest.enemy}</div>
        </div>
        ${quest.isBoss ? '<div class="boss-label">BOSS</div>' : ''}
      `;

      list.appendChild(item);
    });
  },

  // ─── Quest View ───
  showQuest(questId) {
    const quest = this.findQuest(questId);
    if (!quest) return;

    const world = WORLDS.find(w => w.quests.some(q => q.id === questId));
    this.state.currentWorldId = world.id;
    this.state.currentQuestId = questId;
    this.state.checkmarks[questId] = this.state.completed.has(questId);

    this.switchView('quest');
    this.renderQuest(quest, world);
    sfx.harryAppear();
  },

  renderQuest(quest, world) {
    const isCompleted = this.state.completed.has(quest.id);

    // Header
    const header = document.getElementById('questHeader');
    header.style.background = world.bgGradient;
    header.className = `quest-header-card ${quest.isBoss ? 'boss-header' : ''}`;
    header.innerHTML = `
      <div class="quest-label">WORLD ${world.id} ─ Quest #${quest.id}</div>
      <h2>${quest.isBoss ? '💀 ' : ''}${quest.name}</h2>
    `;

    // Harry hint
    const harryHints = this.getHarryHint(quest, world);
    const harryEl = document.getElementById('questHarry');
    harryEl.innerHTML = `
      <div class="harry-dialogue">
        <div class="harry-avatar">🦔</div>
        <div class="harry-bubble">${harryHints}</div>
      </div>
    `;

    // Enemy - Battle Field
    const enemySection = document.getElementById('enemySection');
    const enemyEmoji = quest.isBoss ? '💀' : '👾';
    enemySection.innerHTML = `
      <div class="battle-field ${isCompleted ? 'defeated' : ''}">
        <div class="battle-label">ENCOUNTER!</div>
        <div class="enemy-sprite" id="enemySprite-${quest.id}">
          <div class="enemy-emoji">${enemyEmoji}</div>
          <div class="enemy-hp-bar">
            <div class="enemy-hp-fill ${isCompleted ? 'empty' : ''}" id="enemyHp-${quest.id}"></div>
          </div>
        </div>
        <div class="enemy-name-battle">「${quest.enemy}」</div>
      </div>
    `;

    // Clear condition
    const clearSection = document.getElementById('clearSection');
    clearSection.innerHTML = `
      <h3>🎯 クリア条件</h3>
      <ul class="clear-checklist">
        <li onclick="app.toggleCheck(${quest.id})">
          <div class="check-box ${isCompleted || this.state.checkmarks[quest.id] ? 'checked' : ''}" id="check-${quest.id}">
            ${isCompleted || this.state.checkmarks[quest.id] ? '✓' : ''}
          </div>
          <span>${quest.clear}</span>
        </li>
      </ul>
    `;

    // Complete button
    this.updateCompleteButton(quest.id);
  },

  toggleCheck(questId) {
    if (this.state.completed.has(questId)) return;

    this.state.checkmarks[questId] = !this.state.checkmarks[questId];
    const box = document.getElementById(`check-${questId}`);
    if (box) {
      box.classList.toggle('checked', this.state.checkmarks[questId]);
      box.textContent = this.state.checkmarks[questId] ? '✓' : '';
    }

    // バトルアニメーション
    const sprite = document.getElementById(`enemySprite-${questId}`);
    const hpFill = document.getElementById(`enemyHp-${questId}`);

    if (this.state.checkmarks[questId]) {
      sfx.attack();
      // 攻撃エフェクト → 斬撃 → 敵ダメージ
      this.showSlashEffect();
      if (sprite) {
        setTimeout(() => {
          sprite.classList.add('hit');
          if (hpFill) hpFill.classList.add('empty');
        }, 300);
        setTimeout(() => {
          sprite.classList.remove('hit');
          sprite.classList.add('defeated');
          sfx.enemyDefeat();
        }, 800);
      }
    } else {
      sfx.uncheck();
      // 復活
      if (sprite) {
        sprite.classList.remove('hit', 'defeated');
        if (hpFill) hpFill.classList.remove('empty');
      }
    }

    this.updateCompleteButton(questId);
  },

  showSlashEffect() {
    const field = document.querySelector('.battle-field');
    if (!field) return;
    const slash = document.createElement('div');
    slash.className = 'slash-effect';
    slash.textContent = '⚔️';
    field.appendChild(slash);
    setTimeout(() => slash.remove(), 600);
  },

  updateCompleteButton(questId) {
    const btn = document.getElementById('completeBtn');
    const isCompleted = this.state.completed.has(questId);
    const isChecked = this.state.checkmarks[questId];

    if (isCompleted) {
      btn.className = 'complete-btn already-done';
      btn.textContent = '✅ クリア済み';
    } else if (isChecked) {
      btn.className = 'complete-btn ready';
      btn.textContent = '⚔️ クエストクリア！';
    } else {
      btn.className = 'complete-btn disabled';
      btn.textContent = 'チェックを入れてクリア';
    }
  },

  // ─── Quest Completion ───
  completeQuest() {
    const questId = this.state.currentQuestId;
    if (!questId || this.state.completed.has(questId) || !this.state.checkmarks[questId]) return;

    // Mark complete
    this.state.completed.add(questId);
    this.saveProgress();
    this.updateStatusBar();

    const quest = this.findQuest(questId);
    const world = WORLDS.find(w => w.quests.some(q => q.id === questId));
    const worldComplete = this.getWorldProgress(world.id) === world.quests.length;

    // Show celebration
    this.showConfetti();

    if (quest.isBoss && worldComplete) {
      sfx.worldComplete();
      this.showWorldComplete(world);
    } else if (quest.isBoss) {
      sfx.bossDefeated();
      this.showBossDefeated(quest, world);
    } else {
      sfx.questClear();
      this.showQuestClear(quest, world);
    }
  },

  showQuestClear(quest, world) {
    const level = this.getCurrentLevel();
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('overlayContent');

    content.innerHTML = `
      <div class="level-up-card">
        <div class="icon">⚔️</div>
        <h2>QUEST CLEAR!</h2>
        <div class="quest-name">${quest.name}</div>
        <div class="level-info">Lv.${level.level} ${level.title}</div>
        <div class="harry-message">
          <p>🦔 よくやった！ 「${quest.name}」をクリアしたね！ 次のクエストに進もう！</p>
        </div>
        <button class="continue-btn" onclick="app.goToNextQuest()">次のクエストへ →</button>
      </div>
    `;

    overlay.classList.add('active');
  },

  showBossDefeated(quest, world) {
    const level = this.getCurrentLevel();
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('overlayContent');

    content.innerHTML = `
      <div class="level-up-card boss-defeated">
        <div class="icon">💀</div>
        <h2>BOSS DEFEATED!</h2>
        <div class="quest-name">${quest.name}を倒した！</div>
        <div class="level-info">Lv.${level.level} ${level.title}</div>
        <div class="harry-message">
          <p>🦔 すごい！ ボスを倒したね！ あと少しでこのワールドをクリアできるよ！</p>
        </div>
        <button class="continue-btn" onclick="app.goToNextQuest()">次のクエストへ →</button>
      </div>
    `;

    overlay.classList.add('active');
  },

  showWorldComplete(world) {
    const level = this.getCurrentLevel();
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('overlayContent');

    const nextWorld = WORLDS.find(w => w.id === world.id + 1);
    const isGameComplete = !nextWorld;

    content.innerHTML = `
      <div class="world-complete-card">
        <div class="stars">⭐⭐⭐</div>
        <h2>WORLD ${world.id} COMPLETE!</h2>
        <div class="world-name">${world.icon} ${world.name}</div>
        <div class="reward-text">🏆 報酬：${world.reward}</div>
        <div class="title-earned">
          称号「<span>${world.title}</span>」を獲得！
        </div>
        <div class="level-info" style="font-family: var(--font-pixel); font-size: 20px; color: var(--success); margin-bottom: 24px;">
          Lv.${level.level} ${level.title}
        </div>
        <div class="harry-message">
          <p>🦔 ${world.harryComplete}</p>
        </div>
        ${isGameComplete
          ? '<button class="continue-btn" onclick="app.showFinalComplete()">エンディングへ →</button>'
          : `<button class="continue-btn" onclick="app.goToNextWorld(${world.id + 1})">WORLD ${world.id + 1}へ →</button>`
        }
      </div>
    `;

    overlay.classList.add('active');
  },

  showFinalComplete() {
    this.closeOverlay();
    sfx.worldComplete();

    const mapView = document.getElementById('mapView');
    mapView.innerHTML = `
      <div class="final-complete">
        <div style="font-size: 64px; margin-bottom: 16px; animation: float 2s ease-in-out infinite;">🏰</div>
        <h1>全クエスト完了！</h1>
        <p style="font-size: 18px; margin-bottom: 24px;">一人で自立できる治療家の完成</p>

        <div class="harry-dialogue" style="max-width: 400px; margin: 0 auto 24px;">
          <div class="harry-avatar">🦔</div>
          <div class="harry-bubble">全ワールドクリア、おめでとう！ 君はもう立派な"自立した治療家"だよ。田舎でも、一人でも、自動化で。この冒険で身につけた力は、一生モノだよ。……でもね、本当の冒険はここからだ。がんばれ！</div>
        </div>

        <div class="checklist">
          <div><span class="check" style="color: var(--success)">✅</span> 開業に必要なツールが全て揃っている</div>
          <div><span class="check" style="color: var(--success)">✅</span> 「また来てください」が自然に言える</div>
          <div><span class="check" style="color: var(--success)">✅</span> 患者さんが安定して来院している</div>
          <div><span class="check" style="color: var(--success)">✅</span> リピート率80%超の施術フローがある</div>
          <div><span class="check" style="color: var(--success)">✅</span> 「あの先生のところ」と覚えてもらえている</div>
          <div><span class="check" style="color: var(--success)">✅</span> 自分がいなくても回る仕組みがある</div>
          <div><span class="check" style="color: var(--success)">✅</span> お金の流れを完全に把握している</div>
          <div><span class="check" style="color: var(--success)">✅</span> 固定費を最小化し、身軽に経営している</div>
        </div>

        <div style="margin-top: 24px; font-family: var(--font-pixel); font-size: 20px; color: var(--accent);">
          Lv.100 自立した治療家
        </div>
      </div>
    `;

    this.switchView('map');
    this.showConfetti();
  },

  closeOverlay() {
    sfx.click();
    document.getElementById('overlay').classList.remove('active');
  },

  goToNextQuest() {
    this.closeOverlay();
    const currentId = this.state.currentQuestId;
    const world = WORLDS.find(w => w.quests.some(q => q.id === currentId));
    const questIndex = world.quests.findIndex(q => q.id === currentId);
    const nextQuest = world.quests[questIndex + 1];

    if (nextQuest) {
      sfx.click();
      location.hash = `quest/${nextQuest.id}`;
    } else {
      // Last quest in world — go back to world view
      sfx.openWorld();
      location.hash = `world/${world.id}`;
    }
  },

  goToNextWorld(worldId) {
    this.closeOverlay();
    sfx.openWorld();
    location.hash = `world/${worldId}`;
  },

  // ─── Confetti ───
  showConfetti() {
    const container = document.getElementById('confettiContainer');
    container.innerHTML = '';

    const colors = ['#ff8906', '#2cb67d', '#e53170', '#f39c12', '#3498db', '#9b59b6'];

    for (let i = 0; i < 60; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = `${1.5 + Math.random() * 2}s`;
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      confetti.style.width = `${6 + Math.random() * 8}px`;
      confetti.style.height = `${6 + Math.random() * 8}px`;
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      container.appendChild(confetti);
    }

    setTimeout(() => { container.innerHTML = ''; }, 4000);
  },

  // ─── Harry Hints ───
  getHarryHint(quest, world) {
    if (quest.isBoss) {
      return `これがこのワールドのボスだよ！ 「${quest.enemy}」── 手強い敵だけど、ここまで来た君なら倒せるはず！`;
    }

    const questIndex = world.quests.findIndex(q => q.id === quest.id);
    if (questIndex === 0) {
      return `${world.name}の最初のクエストだよ！ まずは「${quest.name}」から始めよう。一つずつクリアしていけば大丈夫！`;
    }

    return `「${quest.enemy}」── よくある悩みだよね。でもクリア条件は明確だから、一つずつやっていこう！`;
  },

  // ─── Progress Management ───
  getWorldProgress(worldId) {
    const world = WORLDS.find(w => w.id === worldId);
    if (!world) return 0;
    return world.quests.filter(q => this.state.completed.has(q.id)).length;
  },

  isWorldComplete(worldIndex) {
    if (worldIndex <= 0) return true;
    const prevWorld = WORLDS[worldIndex - 1];
    return prevWorld.quests.every(q => this.state.completed.has(q.id));
  },

  getCurrentLevel() {
    const total = this.state.completed.size;
    let current = LEVELS[0];
    for (const lvl of LEVELS) {
      if (total >= lvl.requiredQuests) {
        current = lvl;
      }
    }
    const level = Math.min(100, Math.max(1, Math.floor(total * 100 / 100)));
    return { level, title: current.title };
  },

  findQuest(questId) {
    for (const world of WORLDS) {
      const quest = world.quests.find(q => q.id === questId);
      if (quest) return quest;
    }
    return null;
  },

  // ─── Status Bar ───
  updateStatusBar() {
    const level = this.getCurrentLevel();
    const total = this.state.completed.size;

    document.getElementById('levelBadge').textContent = `Lv.${level.level}`;
    document.getElementById('playerTitle').textContent = level.title;
    document.getElementById('totalProgress').style.width = `${total}%`;
    document.getElementById('progressText').textContent = `${total}/100`;
  },

  // ─── Persistence ───
  saveProgress() {
    const data = {
      completed: [...this.state.completed],
      version: 1
    };
    localStorage.setItem('quest_progress', JSON.stringify(data));
  },

  loadProgress() {
    try {
      const raw = localStorage.getItem('quest_progress');
      if (raw) {
        const data = JSON.parse(raw);
        this.state.completed = new Set(data.completed || []);
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
  },

  resetProgress() {
    if (confirm('本当に進捗をリセットしますか？ すべてのクリアデータが消えます。')) {
      this.state.completed = new Set();
      this.state.checkmarks = {};
      localStorage.removeItem('quest_progress');
      this.updateStatusBar();
      location.hash = 'map';
      this.renderMap();
    }
  },

  // ─── Background Particles ───
  createParticles() {
    const container = document.getElementById('particles');
    const colors = ['var(--accent)', 'var(--success)', '#e53170', '#3498db'];
    for (let i = 0; i < 40; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${6 + Math.random() * 10}s`;
      particle.style.animationDelay = `${Math.random() * 8}s`;
      particle.style.width = `${2 + Math.random() * 4}px`;
      particle.style.height = particle.style.width;
      if (Math.random() > 0.6) {
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      }
      container.appendChild(particle);
    }
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => app.init());
