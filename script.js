function getSafeItem(key) { try { return localStorage.getItem(key); } catch(e){ return null; } }
function setSafeItem(key, val) { try { localStorage.setItem(key, val); } catch(e){} }

var iosFullscreenOverlay = null;

function createIOSLandscapeOverlay(videoEl) {
  removeIOSLandscapeOverlay();
  var overlay = document.createElement('div');
  overlay.id = 'ios-landscape-overlay';
  overlay.style.cssText = [
    'position:fixed',
    'top:0','left:0',
    'width:100vw','height:100vh',
    'background:#000',
    'z-index:99999',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'overflow:hidden'
  ].join(';');

  var closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&#x2715;';
  closeBtn.style.cssText = [
    'position:absolute',
    'top:16px','right:16px',
    'z-index:100001',
    'background:rgba(0,0,0,0.6)',
    'color:white',
    'border:none',
    'border-radius:50%',
    'width:40px','height:40px',
    'font-size:20px',
    'cursor:pointer',
    'display:flex','align-items:center','justify-content:center'
  ].join(';');
  closeBtn.addEventListener('click', removeIOSLandscapeOverlay);

  var vw = document.createElement('div');
  vw.id = 'ios-video-wrapper';

  var sw = window.screen.width;
  var sh = window.screen.height;
  var longSide  = Math.max(sw, sh);
  var shortSide = Math.min(sw, sh);

  vw.style.cssText = [
    'width:'  + longSide  + 'px',
    'height:' + shortSide + 'px',
    'transform:rotate(90deg)',
    'transform-origin:center center',
    'position:absolute',
    'top:50%','left:50%',
    'margin-top:-' + (shortSide/2) + 'px',
    'margin-left:-' + (longSide/2) + 'px'
  ].join(';');

  var playerContainer = videoEl.closest('.plyr') || videoEl.parentElement || videoEl;
  var originalParent  = playerContainer.parentNode;
  var originalNext    = playerContainer.nextSibling;
  overlay._originalParent = originalParent;
  overlay._originalNext   = originalNext;
  overlay._movedEl        = playerContainer;

  playerContainer.style.width  = '100%';
  playerContainer.style.height = '100%';
  if (videoEl !== playerContainer) {
    videoEl.style.width  = '100%';
    videoEl.style.height = '100%';
  }

  vw.appendChild(playerContainer);
  overlay.appendChild(vw);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
  iosFullscreenOverlay = overlay;

  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(function(){});
  }
}

function removeIOSLandscapeOverlay() {
  var overlay = iosFullscreenOverlay || document.getElementById('ios-landscape-overlay');
  if (!overlay) return;
  var movedEl = overlay._movedEl;
  if (movedEl && overlay._originalParent) {
    if (overlay._originalNext) {
      overlay._originalParent.insertBefore(movedEl, overlay._originalNext);
    } else {
      overlay._originalParent.appendChild(movedEl);
    }
    movedEl.style.width  = '';
    movedEl.style.height = '';
    var vid = movedEl.querySelector('video') || movedEl;
    if (vid && vid.tagName === 'VIDEO') { vid.style.width = ''; vid.style.height = ''; }
  }
  if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  iosFullscreenOverlay = null;
  if (screen.orientation && screen.orientation.unlock) {
    screen.orientation.unlock();
  }
}

function isIOSInAppBrowser() {
  var ua = navigator.userAgent;
  var isIOS = /iPad|iPhone|iPod/.test(ua);
  if (!isIOS) return false;
  var isSafari = /Safari/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua);
  var isInApp = !isSafari || /FBAN|FBAV|Twitter|Instagram|Line|MicroMessenger/.test(ua) || (window.navigator.standalone === false && !/Safari/.test(ua));
  return isInApp || (!window.navigator.standalone && /WebKit/.test(ua) && !/Safari/.test(ua));
}

function attachIOSOrientationFix(videoEl) {
  if (!videoEl) return;
  videoEl.addEventListener('webkitbeginfullscreen', function() {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(function(){});
    }
  });
  videoEl.addEventListener('webkitendfullscreen', function() {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  });
}

function patchPlyrFullscreenForIOS(plyrInstance, videoEl) {
  if (!plyrInstance || !videoEl) return;
  plyrInstance.on('enterfullscreen', function() {
    if (isIOSInAppBrowser()) {
      setTimeout(function() { createIOSLandscapeOverlay(videoEl); }, 50);
    } else {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(function(){});
      }
    }
  });
  plyrInstance.on('exitfullscreen', function() {
    removeIOSLandscapeOverlay();
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  });
}

let favorites = [];
try { favorites = JSON.parse(getSafeItem('panzer_favs') || '[]'); } catch(e){}

const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

if (getSafeItem('theme') === 'light') {
  document.documentElement.removeAttribute('data-theme');
  document.getElementById('themeBtn').innerHTML = moonIcon;
} else {
  document.getElementById('themeBtn').innerHTML = sunIcon;
}

const rawData = document.getElementById('kolay-kanal-listesi').textContent;
const lines = rawData.split('\n');
const allChannels = [];
const uniqueCategories = new Set(['Tümü']);

lines.forEach((line, index) => {
  if (!line.trim()) return;
  const parts = line.split('|').map(p => p.trim());
  const len = parts.length;

  if (len >= 2) {
    let name = parts[0], cat = "Diğer", quality = "HD", url = "", logo = null;
    if(len === 2) { url = parts[1]; }
    else if(len === 3) { cat = parts[1] || "Diğer"; url = parts[2]; }
    else if(len === 4) { cat = parts[1] || "Diğer"; quality = parts[2] || "HD"; url = parts[3]; }
    else if(len >= 5) { cat = parts[1] || "Diğer"; quality = parts[2] || "HD"; url = parts[3]; logo = parts[4]; }
    allChannels.push({ id: 'kanal_' + index, name, cat, quality, url, logo });
    uniqueCategories.add(cat);
  }
});

let activeCategory = 'Tümü';
let activeChannelId = null;

window.__onGCastApiAvailable = function(isAvailable) {
  if (isAvailable) {
    cast.framework.CastContext.getInstance().setOptions({
      receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    });
    document.getElementById('castBtn').style.display = 'block';
  }
};

function castCurrentVideo(url, title) {
  if(typeof cast === 'undefined') return;
  const session = cast.framework.CastContext.getInstance().getCurrentSession();
  if (session) {
    const mediaInfo = new chrome.cast.media.MediaInfo(url, url.includes('.mpd') ? 'application/dash+xml' : 'application/x-mpegurl');
    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.title = title;
    const request = new chrome.cast.media.LoadRequest(mediaInfo);
    session.loadMedia(request).catch(err => {});
  }
}

function renderCategories() {
  const catContainer = document.getElementById('categoryList');
  let catArray = Array.from(uniqueCategories);
  const digerIndex = catArray.indexOf("Diğer");
  if (digerIndex > -1) { catArray.splice(digerIndex, 1); catArray.push("Diğer"); }
  if (favorites.length > 0) { catArray.unshift('Favorilerim'); }
  if (!catArray.includes(activeCategory)) activeCategory = 'Tümü';

  catContainer.innerHTML = catArray.map(cat => `
    <button class="cat-btn ${activeCategory === cat ? 'active' : ''}" onclick="selectCategory('${cat}')">
      ${cat}
    </button>
  `).join('');
}

function selectCategory(cat) { activeCategory = cat; renderCategories(); renderChannels(); }

function toggleFav(id, event) {
  event.stopPropagation();
  if(favorites.includes(id)) { favorites = favorites.filter(f => f !== id); }
  else { favorites.push(id); }
  setSafeItem('panzer_favs', JSON.stringify(favorites));
  renderCategories();
  renderChannels();
}

function getHighlightedText(text, search) {
  if (!search) return text;
  const regex = new RegExp(`(${search})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}

function renderChannels() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const listContainer = document.getElementById('channelList');

  const filteredChannels = allChannels.filter(c => {
    if (activeCategory === 'Favorilerim' && !favorites.includes(c.id)) return false;
    const matchCat = (activeCategory === 'Tümü' || activeCategory === 'Favorilerim' || c.cat === activeCategory);
    const matchSearch = c.name.toLowerCase().includes(searchTerm) || c.cat.toLowerCase().includes(searchTerm);
    return matchCat && matchSearch;
  });

  document.getElementById('channelCount').textContent = filteredChannels.length;

  if (filteredChannels.length === 0) {
    listContainer.innerHTML = '<div class="empty-state">Kanal bulunamadı.</div>';
    return;
  }

  listContainer.innerHTML = filteredChannels.map(c => {
    const isFav = favorites.includes(c.id);
    const logoHtml = c.logo
      ? `<img src="${c.logo}" alt="logo" onerror="this.outerHTML='<span>${c.name.charAt(0)}</span>'"/>`
      : `<span>${c.name.charAt(0)}</span>`;

    return `
    <div class="channel-card ${activeChannelId === c.id ? 'active' : ''}" onclick="playChannel('${c.id}')">
      <div style="display:flex; align-items:center; flex:1; min-width:0;">
        <div class="cc-logo">${logoHtml}</div>
        <div class="cc-info">
          <div class="cc-name">${getHighlightedText(c.name, searchTerm)}</div>
          <div class="cc-cat">${getHighlightedText(c.cat, searchTerm)}</div>
        </div>
      </div>
      <div class="cc-actions">
        <div class="cc-quality">${c.quality}</div>
        <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${c.id}', event)" title="Favorilere Ekle">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
      </div>
    </div>
  `}).join('');
}

renderCategories();
renderChannels();

const basicPlyrOptions = {
  controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
  settings: ['quality', 'loop'],
  fullscreen: { enabled: true, fallback: true, iosNative: false },
  i18n: {
    speed: 'Hız',
    normal: 'Normal',
    quality: 'Kalite',
    qualityLabel: { 0: 'Otomatik' },
    qualityBadge: { 0: 'Oto' },
    play: 'Oynat',
    pause: 'Duraklat',
    mute: 'Sessiz',
    unmute: 'Sesi Aç',
    enterFullscreen: 'Tam Ekran',
    exitFullscreen: 'Tam Ekrandan Çık'
  }
};

let player = null;
let hls = null;
let dashPlayer = null;

function playChannel(id) {
  activeChannelId = id;
  const channel = allChannels.find(c => c.id === id);
  renderChannels();

  if (window.innerWidth <= 960) {
    document.querySelector('.player-section').scrollIntoView({ behavior: 'smooth' });
  }

  document.getElementById('placeholder').style.display = 'none';
  document.getElementById('nowPlaying').style.display = 'flex';
  document.getElementById('npTitle').textContent = channel.name;
  document.getElementById('npSub').textContent = `${channel.cat} • ${channel.quality}`;

  const url = channel.url;
  castCurrentVideo(url, channel.name);

  if (player) { player.destroy(); player = null; }
  if (hls) { hls.destroy(); hls = null; }
  if (dashPlayer) { dashPlayer.destroy(); dashPlayer = null; }

  const videoContainer = document.getElementById('videoContainer');
  videoContainer.innerHTML = '<video id="videoPlayer" controls crossorigin playsinline></video>';
  const videoElement = document.getElementById('videoPlayer');
  attachIOSOrientationFix(videoElement);

  if (url.includes('.m3u8')) {
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      const initHls = (targetUrl, fallbackUrl) => {
        if (hls) { hls.destroy(); hls = null; }
        if (player) { player.destroy(); player = null; }

        videoContainer.innerHTML = '<video id="videoPlayer" controls crossorigin playsinline></video>';
        const vElement = document.getElementById('videoPlayer');
        attachIOSOrientationFix(vElement);

        hls = new Hls({ maxMaxBufferLength: 30 });

        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          let availableQualities = hls.levels.map(l => l.height).filter(h => h);
          availableQualities = [...new Set(availableQualities)].sort((a, b) => b - a);

          const resRegex = /(1440|1080|720|480|360|240)p/i;
          let isCustom = false;
          let customQ = [1440, 1080, 720, 480, 360];
          let resMatch = targetUrl.match(resRegex);

          if (availableQualities.length <= 1 && resMatch) {
            isCustom = true;
            availableQualities = customQ;
          } else if (availableQualities.length === 0) {
            availableQualities = [1080];
          }

          availableQualities.unshift(0);

          let options = { ...basicPlyrOptions };
          options.quality = {
            default: (isCustom && resMatch) ? parseInt(resMatch[1]) : 0,
            options: availableQualities,
            forced: true,
            onChange: (newQuality) => {
              if (isCustom) {
                let nextUrl = targetUrl;
                if (newQuality === 0) {
                  nextUrl = fallbackUrl;
                } else {
                  nextUrl = targetUrl.replace(resRegex, `${newQuality}p`);
                }
                if (nextUrl !== targetUrl) {
                  initHls(nextUrl, fallbackUrl);
                }
              } else {
                if (newQuality === 0) {
                  hls.currentLevel = -1;
                } else {
                  hls.levels.forEach((level, levelIndex) => {
                    if (level.height === newQuality) {
                      hls.currentLevel = levelIndex;
                    }
                  });
                }
              }
            }
          };

          player = new Plyr(vElement, options);
          patchPlyrFullscreenForIOS(player, vElement);
          player.play().catch(e => {});
        });

        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                if (fallbackUrl && targetUrl !== fallbackUrl) {
                  initHls(fallbackUrl, fallbackUrl);
                } else {
                  setTimeout(() => { if(hls) hls.startLoad(); }, 3000);
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                if(hls) hls.recoverMediaError();
                break;
              default:
                if(hls) hls.destroy();
                break;
            }
          }
        });

        hls.loadSource(targetUrl);
        hls.attachMedia(vElement);
      };

      initHls(url, url);

    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = url;
      player = new Plyr(videoElement, basicPlyrOptions);
      patchPlyrFullscreenForIOS(player, videoElement);
      videoElement.addEventListener('loadedmetadata', function() {
        if(player) player.play().catch(e=>{});
      }, {once: true});
    }

  } else if (url.includes('.mpd')) {
    if (typeof dashjs !== 'undefined') {
      dashPlayer = dashjs.MediaPlayer().create();
      dashPlayer.initialize(videoElement, url, false);

      dashPlayer.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, function() {
        const bitrates = dashPlayer.getBitrateInfoListFor('video');
        let availableQualities = bitrates.map(b => b.height).filter(h => h);
        availableQualities = [...new Set(availableQualities)].sort((a, b) => b - a);

        if (availableQualities.length === 0) availableQualities = [1080];
        availableQualities.unshift(0);

        let options = { ...basicPlyrOptions };

        options.quality = {
          default: 0,
          options: availableQualities,
          forced: true,
          onChange: (newQuality) => {
            if (newQuality === 0) {
              dashPlayer.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: true } } } });
            } else {
              dashPlayer.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: false } } } });
              const index = bitrates.findIndex(b => b.height === newQuality);
              if (index !== -1) dashPlayer.setQualityFor('video', index);
            }
          }
        };

        player = new Plyr(videoElement, options);
        patchPlyrFullscreenForIOS(player, videoElement);
        player.play().catch(e => {});
      });
    }

  } else {
    videoElement.src = url;
    player = new Plyr(videoElement, basicPlyrOptions);
    patchPlyrFullscreenForIOS(player, videoElement);
    if(player) player.play().catch(e=>{});
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const btn = document.getElementById('themeBtn');
  if (html.getAttribute('data-theme') === 'dark') {
    html.removeAttribute('data-theme'); btn.innerHTML = moonIcon; setSafeItem('theme', 'light');
  } else {
    html.setAttribute('data-theme', 'dark'); btn.innerHTML = sunIcon; setSafeItem('theme', 'dark');
  }
}

function openInfoModal() {
  const modal = document.getElementById('infoModal');
  modal.style.display = 'flex';
  setTimeout(() => { modal.classList.add('show'); }, 10);
}

function closeInfoModal(e) {
  if (e) e.stopPropagation();
  const modal = document.getElementById('infoModal');
  modal.classList.remove('show');
  setTimeout(() => { modal.style.display = 'none'; }, 300);
}
