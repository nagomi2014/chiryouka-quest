// 治療家クエスト ─ Sound Effects (Web Audio API)
const sfx = {
  ctx: null,

  init() {
    // AudioContext は最初のユーザー操作時に初期化
    document.addEventListener('click', () => {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    }, { once: true });
  },

  // ─── 基本音生成 ───
  playTone(freq, duration, type = 'square', volume = 0.15, delay = 0) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);

    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration);
  },

  // ─── 効果音 ───

  // カーソル移動・ホバー音
  hover() {
    this.playTone(800, 0.05, 'square', 0.05);
  },

  // クリック・選択音
  click() {
    this.playTone(600, 0.08, 'square', 0.1);
    this.playTone(900, 0.08, 'square', 0.1, 0.05);
  },

  // チェックボックスON
  check() {
    this.playTone(523, 0.1, 'square', 0.1);
    this.playTone(659, 0.1, 'square', 0.1, 0.08);
    this.playTone(784, 0.15, 'square', 0.1, 0.16);
  },

  // チェックボックスOFF
  uncheck() {
    this.playTone(600, 0.08, 'square', 0.08);
    this.playTone(400, 0.1, 'square', 0.08, 0.06);
  },

  // クエストクリア！（ファンファーレ）
  questClear() {
    const notes = [523, 659, 784, 1047]; // C E G C
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.2, 'square', 0.12, i * 0.12);
    });
    // 和音で締め
    setTimeout(() => {
      this.playTone(523, 0.4, 'square', 0.08);
      this.playTone(659, 0.4, 'square', 0.08);
      this.playTone(784, 0.4, 'square', 0.08);
      this.playTone(1047, 0.5, 'square', 0.1);
    }, 500);
  },

  // ボス撃破（重厚ファンファーレ）
  bossDefeated() {
    // ドラマチックな導入
    this.playTone(262, 0.15, 'sawtooth', 0.1);
    this.playTone(330, 0.15, 'sawtooth', 0.1, 0.12);
    this.playTone(392, 0.15, 'sawtooth', 0.1, 0.24);
    // 一瞬の間
    // メインファンファーレ
    const melody = [523, 659, 784, 880, 1047];
    melody.forEach((freq, i) => {
      this.playTone(freq, 0.25, 'square', 0.12, 0.5 + i * 0.15);
    });
    // 最後の和音
    setTimeout(() => {
      this.playTone(523, 0.6, 'square', 0.08);
      this.playTone(659, 0.6, 'square', 0.08);
      this.playTone(784, 0.6, 'square', 0.08);
      this.playTone(1047, 0.6, 'square', 0.1);
      this.playTone(1319, 0.8, 'square', 0.1);
    }, 1300);
  },

  // ワールドクリア（壮大ファンファーレ）
  worldComplete() {
    // 上昇アルペジオ
    const arp = [262, 330, 392, 523, 659, 784, 1047];
    arp.forEach((freq, i) => {
      this.playTone(freq, 0.12, 'square', 0.1, i * 0.08);
    });

    // メインテーマ
    setTimeout(() => {
      const theme = [
        [1047, 0.3], [880, 0.15], [1047, 0.3],
        [1319, 0.4], [1047, 0.2], [1319, 0.6]
      ];
      let t = 0;
      theme.forEach(([freq, dur]) => {
        this.playTone(freq, dur, 'square', 0.12, t);
        t += dur * 0.8;
      });
    }, 600);

    // フィナーレ和音
    setTimeout(() => {
      [523, 659, 784, 1047, 1319, 1568].forEach(freq => {
        this.playTone(freq, 1.0, 'square', 0.06);
      });
    }, 1800);
  },

  // レベルアップ音
  levelUp() {
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.15, 'square', 0.1, i * 0.1);
    });
  },

  // ワールド選択（ドアを開ける音）
  openWorld() {
    this.playTone(400, 0.1, 'square', 0.08);
    this.playTone(500, 0.1, 'square', 0.08, 0.08);
    this.playTone(600, 0.1, 'square', 0.08, 0.16);
    this.playTone(800, 0.15, 'square', 0.1, 0.24);
  },

  // 戻るボタン
  back() {
    this.playTone(600, 0.08, 'square', 0.06);
    this.playTone(400, 0.1, 'square', 0.06, 0.06);
  },

  // はりぃちゃん登場
  harryAppear() {
    this.playTone(880, 0.08, 'sine', 0.08);
    this.playTone(1100, 0.08, 'sine', 0.08, 0.06);
    this.playTone(1320, 0.12, 'sine', 0.1, 0.12);
  },

  // 攻撃音（斬撃）
  attack() {
    // ノイズっぽい斬撃音
    this.playTone(200, 0.05, 'sawtooth', 0.15);
    this.playTone(800, 0.08, 'sawtooth', 0.12, 0.02);
    this.playTone(400, 0.1, 'square', 0.08, 0.06);
  },

  // 敵撃破音
  enemyDefeat() {
    this.playTone(300, 0.08, 'sawtooth', 0.1);
    this.playTone(200, 0.1, 'sawtooth', 0.1, 0.06);
    this.playTone(100, 0.15, 'sawtooth', 0.08, 0.12);
    // 爆散音
    this.playTone(150, 0.2, 'square', 0.06, 0.2);
  }
};

// 初期化
sfx.init();
