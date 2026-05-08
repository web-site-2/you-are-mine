/* =====================================================
   ROMANTIC ARABIC SPA — script.js  (v2 — full fix)
   All bugs fixed · Re-entry safe · Mobile optimised
   ===================================================== */
'use strict';

/* ══════════════════════════════════════════════════
   ⚙️  CONFIG  —  Edit these values to personalise
   ══════════════════════════════════════════════════ */
const CONFIG = {
  password:      'حبيبي',                           // كلمة السر
  relationStart: new Date('2023-02-14T00:00:00'),   // تاريخ بداية العلاقة

  messages: [
    { icon: '💌', text: 'لو عمري كان كتاب، كل صفحة فيه كانت بتبدأ بسمك...' },
    { icon: '🌹', text: 'ما عرفت معنى الطمأنينة إلا لما كنت جنبك، وما عرفت معنى الغياب إلا لما بعدت عني.' },
    { icon: '🌙', text: 'كل نجمة في السما تحكي جزء من قصتنا، والقصة لسه في أجمل فصولها.' },
    { icon: '💫', text: 'أنتِ مش بس حبيبتي، أنتِ البيت اللي حلمت بيه ولقيته أجمل مما تخيلت.' },
    { icon: '❤️', text: 'آسف على كل لحظة وجعتك فيها. وعدي إنك دايماً تلاقي قلبي طريق للبيت.' },
    { icon: '✨', text: 'بحبك مش بس الأيام الحلوة.. بحبك في كل يوم، في كل تفصيلة، في كل نظرة.' },
  ],

  finalTitle: 'أنتِ الأجمل في حياتي',
  finalMsg:
    'كل كلمة قلتها جاية من أعمق مكان في قلبي.\n' +
    'أنتِ نعمة ما أستحقها، وحلم صحيت منه وهو حقيقي.\n' +
    'بحبك دايماً... أكثر مما تتخيلي ❤️',
};

/* ══════════════════════════════════════════════════
   🌐  GLOBAL STATE
   ══════════════════════════════════════════════════ */
let _currentScreen  = null;   // active <section>
let _countdownTimer = null;   // setInterval handle
let _confettiAF     = null;   // requestAnimationFrame handle
let _msgTypingTimer = null;   // setInterval handle for typing
let _isTransitioning = false; // prevent double-clicks during transition

/* ══════════════════════════════════════════════════
   ❤️  FALLING HEARTS  (background canvas)
   ══════════════════════════════════════════════════ */
(function initHearts() {
  const canvas = document.getElementById('heartsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, hearts = [];

  const CHARS   = ['❤', '♡', '❣', '💕'];
  const MAX     = window.innerWidth < 480 ? 12 : 20;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkHeart() {
    return {
      x:    Math.random() * W,
      y:    -30,
      size: 10 + Math.random() * 16,
      vy:   0.55 + Math.random() * 1.0,
      vx:   0,
      drift:0,
      sway: (Math.random() - 0.5) * 0.9,
      angle:Math.random() * Math.PI * 2,
      alpha:0.12 + Math.random() * 0.38,
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
    };
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    if (hearts.length < MAX && Math.random() < 0.055) hearts.push(mkHeart());

    hearts = hearts.filter(h => {
      h.drift  += 0.018;
      h.x      += Math.sin(h.drift + h.angle) * h.sway;
      h.y      += h.vy;
      ctx.save();
      ctx.globalAlpha = h.alpha;
      ctx.font        = `${h.size}px serif`;
      ctx.textAlign   = 'center';
      ctx.fillText(h.char, h.x, h.y);
      ctx.restore();
      return h.y < H + 40;
    });

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  tick();
})();

/* ══════════════════════════════════════════════════
   🔊  CLICK SOUND  (Web Audio API — no file needed)
   ══════════════════════════════════════════════════ */
let _audioCtx = null;
function playClick() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();
    osc.connect(gain);
    gain.connect(_audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, _audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, _audioCtx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.07, _audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.2);
    osc.start(_audioCtx.currentTime);
    osc.stop(_audioCtx.currentTime + 0.22);
  } catch (e) { /* browser may restrict — silent fail */ }
}

/* ══════════════════════════════════════════════════
   🎬  SCREEN TRANSITION ENGINE
   ══════════════════════════════════════════════════ */
function showScreen(id, onShown) {
  if (_isTransitioning) return;
  const next = document.getElementById(id);
  if (!next || next === _currentScreen) return;
  _isTransitioning = true;

  const prev = _currentScreen;

  if (prev) {
    prev.classList.add('exit');
    setTimeout(() => {
      prev.classList.remove('active', 'exit');
    }, 660);
  }

  const delay = prev ? 340 : 0;
  setTimeout(() => {
    next.classList.add('active');
    _currentScreen = next;
    _isTransitioning = false;
    if (typeof onShown === 'function') onShown();
  }, delay);
}

/* ══════════════════════════════════════════════════
   🔐  PASSWORD SCREEN
   ══════════════════════════════════════════════════ */
function initPasswordScreen() {
  const input  = document.getElementById('passwordInput');
  const btn    = document.getElementById('unlockBtn');
  const errMsg = document.getElementById('errorMsg');
  const eyeBtn = document.getElementById('eyeBtn');

  if (!input || !btn) return;

  /* Show/hide password toggle */
  eyeBtn.addEventListener('click', () => {
    const isText = input.type === 'text';
    input.type   = isText ? 'password' : 'text';
    eyeBtn.textContent = isText ? '👁' : '🙈';
    input.focus();
  });

  /* Inject shake keyframe once */
  if (!document.getElementById('shakeKF')) {
    const s = document.createElement('style');
    s.id = 'shakeKF';
    s.textContent = `
      @keyframes shake {
        0%,100%{ transform:translateX(0) }
        20%    { transform:translateX(-9px) }
        40%    { transform:translateX(9px) }
        60%    { transform:translateX(-5px) }
        80%    { transform:translateX(5px) }
      }`;
    document.head.appendChild(s);
  }

  function tryUnlock() {
    const val = input.value.trim();

    if (val === CONFIG.password) {
      /* ✅ Correct */
      playClick();
      input.blur();
      errMsg.classList.remove('show');
      showScreen('screen-countdown', initCountdown);

    } else {
      /* ❌ Wrong */
      errMsg.classList.add('show');
      input.style.animation = 'none';
      void input.offsetWidth; // reflow to restart animation
      input.style.animation = 'shake 0.42s ease';
      input.style.borderColor = 'var(--crimson)';

      setTimeout(() => {
        errMsg.classList.remove('show');
        input.style.borderColor = '';
        input.style.animation   = '';
      }, 2600);
    }
  }

  /* Remove old listeners safely by cloning the button */
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', tryUnlock);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
}

/* ══════════════════════════════════════════════════
   ⏳  COUNTDOWN SCREEN
   ══════════════════════════════════════════════════ */
function initCountdown() {
  /* Clear any previous timer */
  if (_countdownTimer) { clearInterval(_countdownTimer); _countdownTimer = null; }

  const cards = document.querySelectorAll('.count-card');
  const els   = {
    years:   document.getElementById('years'),
    months:  document.getElementById('months'),
    days:    document.getElementById('days'),
    hours:   document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
  };

  /* Reset card visibility */
  cards.forEach(c => c.classList.remove('revealed'));

  /* Staggered entrance */
  cards.forEach((c, i) => setTimeout(() => c.classList.add('revealed'), 300 + i * 130));

  /* Number update with bump animation */
  function setNum(el, val) {
    if (!el) return;
    const str = String(val).padStart(2, '0');
    if (el.textContent === str) return;
    el.textContent = str;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 320);
  }

  function update() {
    let diff = Math.max(0, Math.floor((Date.now() - CONFIG.relationStart.getTime()) / 1000));
    const s  = diff % 60; diff = Math.floor(diff / 60);
    const m  = diff % 60; diff = Math.floor(diff / 60);
    const h  = diff % 24; diff = Math.floor(diff / 24);
    const y  = Math.floor(diff / 365);
    const mo = Math.floor((diff % 365) / 30);
    const d  = diff % 30;

    setNum(els.years,   y);
    setNum(els.months,  mo);
    setNum(els.days,    d);
    setNum(els.hours,   h);
    setNum(els.minutes, m);
    setNum(els.seconds, s);
  }

  update();
  _countdownTimer = setInterval(update, 1000);

  /* Next button — clone to remove stale listeners */
  const rawBtn = document.getElementById('countdownNext');
  const newBtn = rawBtn.cloneNode(true);
  rawBtn.parentNode.replaceChild(newBtn, rawBtn);
  newBtn.addEventListener('click', () => {
    playClick();
    showScreen('screen-messages', initMessages);
  }, { once: true });
}

/* ══════════════════════════════════════════════════
   💌  MESSAGES SCREEN
   ══════════════════════════════════════════════════ */
function initMessages() {
  const msgs      = CONFIG.messages;
  const iconEl    = document.getElementById('msgIcon');
  const textEl    = document.getElementById('msgText');
  const dotsEl    = document.getElementById('progressDots');
  const fillEl    = document.getElementById('msgProgressFill');
  const nextLbl   = document.getElementById('msgNextLabel');
  const card      = document.getElementById('msgCard');

  /* Clone next button to clear old listeners */
  const rawBtn = document.getElementById('msgNext');
  const nextBtn = rawBtn.cloneNode(true);
  rawBtn.parentNode.replaceChild(nextBtn, rawBtn);
  /* get fresh reference to the label span inside the clone */
  const newNextLbl = nextBtn.querySelector('#msgNextLabel') || nextBtn;

  let current = 0;
  let typing  = false;

  /* Build progress dots */
  dotsEl.innerHTML = '';
  msgs.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', `رسالة ${i + 1}`);
    d.addEventListener('click', () => { if (!typing && i !== current) jumpTo(i); });
    dotsEl.appendChild(d);
  });

  /* Stop any running typing interval */
  function stopTyping() {
    if (_msgTypingTimer) { clearInterval(_msgTypingTimer); _msgTypingTimer = null; }
    if (textEl) textEl.classList.remove('typing');
  }

  /* Type text character by character */
  function typeText(el, text, speed, onDone) {
    stopTyping();
    el.textContent = '';
    el.classList.add('typing');
    typing = true;
    let i = 0;
    _msgTypingTimer = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) {
        stopTyping();
        typing = false;
        if (typeof onDone === 'function') onDone();
      }
    }, speed);
  }

  /* Show a specific message */
  function showMsg(idx) {
    const msg = msgs[idx];
    current   = idx;
    stopTyping();

    /* Progress bar */
    if (fillEl) fillEl.style.width = `${((idx + 1) / msgs.length) * 100}%`;

    /* Update dots */
    dotsEl.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === idx));

    /* Card hide → update → show */
    card.classList.add('hiding');
    setTimeout(() => {
      iconEl.textContent = msg.icon;
      card.classList.remove('hiding');
      typeText(textEl, msg.text, 34);
    }, 300);

    /* Button label */
    const isLast = idx === msgs.length - 1;
    if (newNextLbl.tagName === 'SPAN') {
      newNextLbl.textContent = isLast ? 'إلى الصور 📸' : 'التالي';
    } else {
      nextBtn.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent = isLast ? ' إلى الصور 📸' : ' التالي'; });
    }
  }

  function jumpTo(idx) { showMsg(idx); }

  showMsg(0);

  nextBtn.addEventListener('click', () => {
    playClick();
    if (current + 1 < msgs.length) {
      showMsg(current + 1);
    } else {
      stopTyping();
      showScreen('screen-gallery', initGallery);
    }
  });
}

/* ══════════════════════════════════════════════════
   🖼️  GALLERY SCREEN
   ══════════════════════════════════════════════════ */
function initGallery() {
  const items = document.querySelectorAll('.gallery-item');
  /* Reset, then stagger-reveal */
  items.forEach(it => it.classList.remove('revealed'));
  items.forEach((it, i) => setTimeout(() => it.classList.add('revealed'), 180 + i * 115));

  const rawBtn = document.getElementById('galleryNext');
  const newBtn = rawBtn.cloneNode(true);
  rawBtn.parentNode.replaceChild(newBtn, rawBtn);
  newBtn.addEventListener('click', () => {
    playClick();
    showScreen('screen-music', initMusic);
  }, { once: true });
}

/* ══════════════════════════════════════════════════
   🎶  MUSIC SCREEN
   ══════════════════════════════════════════════════ */
function initMusic() {
  const audio    = document.getElementById('bgMusic');
  const vinyl    = document.getElementById('vinyl');
  const bars     = document.getElementById('soundBars');
  const rawPlay  = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const playLbl  = document.getElementById('playLabel');

  /* Clone play button to remove stale listeners */
  const playBtn = rawPlay.cloneNode(true);
  rawPlay.parentNode.replaceChild(playBtn, rawPlay);
  const pIcon = playBtn.querySelector('.play-icon') || playBtn.querySelector('#playIcon');
  const pLbl  = playBtn.querySelector('#playLabel');

  let playing = false;

  function setPlaying(state) {
    playing = state;
    if (pIcon) pIcon.textContent = state ? '⏸' : '▶';
    if (pLbl)  pLbl.textContent  = state ? 'إيقاف' : 'تشغيل';
    if (state) {
      vinyl.classList.add('spinning');
      bars.classList.add('active');
    } else {
      vinyl.classList.remove('spinning');
      bars.classList.remove('active');
    }
  }

  playBtn.addEventListener('click', () => {
    playClick();
    if (!playing) {
      audio.play().catch(() => {
        /* Browser blocked autoplay — UI still animates for demo */
        console.warn('Audio play blocked by browser. Place music.mp3 in project folder.');
      });
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  });

  audio.addEventListener('ended', () => setPlaying(false));

  /* Next button */
  const rawNext = document.getElementById('musicNext');
  const nextBtn = rawNext.cloneNode(true);
  rawNext.parentNode.replaceChild(nextBtn, rawNext);
  nextBtn.addEventListener('click', () => {
    playClick();
    showScreen('screen-final', initFinal);
  }, { once: true });
}

/* ══════════════════════════════════════════════════
   🎉  FINAL SCENE
   ══════════════════════════════════════════════════ */
function initFinal() {
  const titleEl = document.getElementById('finalTitle');
  const msgEl   = document.getElementById('finalMsg');

  /* Reset text */
  if (titleEl) { titleEl.textContent = ''; titleEl.classList.remove('glow'); }
  if (msgEl)   msgEl.textContent = '';

  startConfetti();

  /* Type title, then body */
  typeElement(titleEl, CONFIG.finalTitle, 70, () => {
    if (titleEl) titleEl.classList.add('glow');
    setTimeout(() => typeElement(msgEl, CONFIG.finalMsg, 30), 500);
  });

  /* Restart button */
  const rawBtn = document.getElementById('restartBtn');
  const newBtn = rawBtn.cloneNode(true);
  rawBtn.parentNode.replaceChild(newBtn, rawBtn);
  newBtn.addEventListener('click', fullReset, { once: true });
}

/* Typing helper for multi-line text */
function typeElement(el, text, speed, onDone) {
  if (!el) { if (typeof onDone === 'function') onDone(); return; }
  el.textContent = '';
  el.classList.add('typing');
  const lines = text.split('\n');
  let li = 0, ci = 0;

  const iv = setInterval(() => {
    if (li >= lines.length) {
      clearInterval(iv);
      el.classList.remove('typing');
      if (typeof onDone === 'function') onDone();
      return;
    }
    const line = lines[li];
    if (ci < line.length) {
      el.textContent += line[ci++];
    } else {
      if (li < lines.length - 1) el.textContent += '\n';
      li++; ci = 0;
    }
  }, speed);
}

/* ══════════════════════════════════════════════════
   🎊  CONFETTI
   ══════════════════════════════════════════════════ */
function startConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const COLORS = ['#ff6b9d','#e63946','#ffb3cb','#fff0f5','#c0392b','#f7c59f','#ff8fab','#ffd6e7'];
  const CHARS  = ['❤', '✦', '✿', '★'];

  const pieces = Array.from({ length: window.innerWidth < 480 ? 55 : 90 }, () => ({
    x:     Math.random() * canvas.width,
    y:     -20 - Math.random() * canvas.height * 0.5,
    r:     4 + Math.random() * 9,
    vy:    1.4 + Math.random() * 2.8,
    drift: 0,
    sway:  (Math.random() - 0.5) * 1.4,
    rot:   Math.random() * 360,
    rotV:  (Math.random() - 0.5) * 3.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    char:  CHARS[Math.floor(Math.random() * CHARS.length)],
    useChar: Math.random() > 0.4,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y     += p.vy;
      p.drift += 0.022;
      p.x     += Math.sin(p.drift) * p.sway;
      p.rot   += p.rotV;
      if (p.y > canvas.height + 30) { p.y = -20; p.x = Math.random() * canvas.width; }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.globalAlpha = 0.88;

      if (p.useChar) {
        ctx.font      = `${p.r * 2}px serif`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.char, 0, p.r);
      } else {
        ctx.fillStyle = p.color;
        /* rectangle petal */
        ctx.fillRect(-p.r * 0.5, -p.r * 0.5, p.r, p.r * 1.4);
      }
      ctx.restore();
    });
    _confettiAF = requestAnimationFrame(draw);
  }
  draw();
}

function stopConfetti() {
  if (_confettiAF) { cancelAnimationFrame(_confettiAF); _confettiAF = null; }
  const canvas = document.getElementById('confettiCanvas');
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

/* ══════════════════════════════════════════════════
   🔄  FULL RESET  (restart from password screen)
   ══════════════════════════════════════════════════ */
function fullReset() {
  playClick();
  stopConfetti();

  /* Stop countdown */
  if (_countdownTimer) { clearInterval(_countdownTimer); _countdownTimer = null; }

  /* Stop typing */
  if (_msgTypingTimer) { clearInterval(_msgTypingTimer); _msgTypingTimer = null; }

  /* Stop music */
  const audio = document.getElementById('bgMusic');
  if (audio) { audio.pause(); audio.currentTime = 0; }

  /* Reset vinyl + bars */
  const vinyl = document.getElementById('vinyl');
  const bars  = document.getElementById('soundBars');
  if (vinyl) vinyl.classList.remove('spinning');
  if (bars)  bars.classList.remove('active');

  /* Reset countdown cards */
  document.querySelectorAll('.count-card').forEach(c => c.classList.remove('revealed'));

  /* Reset gallery */
  document.querySelectorAll('.gallery-item').forEach(g => g.classList.remove('revealed'));

  /* Reset final scene */
  const ft = document.getElementById('finalTitle');
  const fm = document.getElementById('finalMsg');
  if (ft) { ft.textContent = ''; ft.classList.remove('glow'); }
  if (fm)  fm.textContent = '';

  /* Reset message progress bar */
  const fill = document.getElementById('msgProgressFill');
  if (fill) fill.style.width = '0%';

  /* Reset password input */
  const pw = document.getElementById('passwordInput');
  if (pw) { pw.value = ''; pw.type = 'password'; }
  const eye = document.getElementById('eyeBtn');
  if (eye) eye.textContent = '👁';
  const err = document.getElementById('errorMsg');
  if (err) err.classList.remove('show');

  /* Go back to password */
  showScreen('screen-password');
}

/* ══════════════════════════════════════════════════
   🚀  INIT
   ══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  _currentScreen = document.getElementById('screen-password');
  initPasswordScreen();
});
