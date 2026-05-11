(function () {
  const html = document.documentElement;
  const weatherMeta = document.getElementById('weather-meta');

  const WEATHER_LABELS = {
    clear: '晴',
    cloudy: '多云',
    overcast: '阴',
    fog: '雾',
    drizzle: '毛毛雨',
    rain: '雨',
    snow: '雪',
    thunder: '雷雨'
  };
  const PLAYER_THEME_CLASSES = ['xf-original', 'xf-sky', 'xf-orange', 'xf-darkGreen', 'xf-wineRed', 'xf-girlPink'];

  function getPlayerThemeByWeather(scene, isDay) {
    if (scene === 'clear') return isDay ? 'xf-sky' : 'xf-darkGreen';
    if (scene === 'cloudy') return 'xf-original';
    if (scene === 'overcast') return 'xf-original';
    if (scene === 'fog') return 'xf-girlPink';
    if (scene === 'rain') return 'xf-darkGreen';
    if (scene === 'snow') return 'xf-sky';
    if (scene === 'thunder') return 'xf-wineRed';
    return 'xf-original';
  }

  function syncMusicPlayerTheme(scene, isDay) {
    const playerRoot = document.getElementById('xf-MusicPlayer');
    if (!playerRoot) return;

    const nextTheme = getPlayerThemeByWeather(scene, isDay);
    playerRoot.setAttribute('data-themeColor', nextTheme);

    const playerMain = playerRoot.querySelector('.xf-MusicPlayer-Main');
    if (!playerMain) return;

    playerMain.classList.remove(...PLAYER_THEME_CLASSES);
    playerMain.classList.add(nextTheme);
  }

  function setMetaText(text) {
    if (!weatherMeta) return;
    weatherMeta.textContent = text;
  }

  function classifyWeatherCode(code) {
    if (code === 0) return { scene: 'clear', label: WEATHER_LABELS.clear };
    if (code === 1 || code === 2) return { scene: 'cloudy', label: WEATHER_LABELS.cloudy };
    if (code === 3) return { scene: 'overcast', label: WEATHER_LABELS.overcast };
    if (code === 45 || code === 48) return { scene: 'fog', label: WEATHER_LABELS.fog };
    if ([51, 53, 55, 56, 57].includes(code)) return { scene: 'rain', label: WEATHER_LABELS.drizzle };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { scene: 'rain', label: WEATHER_LABELS.rain };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { scene: 'snow', label: WEATHER_LABELS.snow };
    if ([95, 96, 99].includes(code)) return { scene: 'thunder', label: WEATHER_LABELS.thunder };
    return { scene: 'cloudy', label: WEATHER_LABELS.cloudy };
  }

  function applyWeatherTheme(options) {
    const { scene, isDay, cloudCover } = options;
    html.setAttribute('data-weather', scene);
    html.setAttribute('data-daypart', isDay ? 'day' : 'night');
    syncMusicPlayerTheme(scene, isDay);

    if (Number.isFinite(cloudCover)) {
      const opacity = Math.min(Math.max(cloudCover / 100, 0.15), 0.95);
      html.style.setProperty('--weather-cloud-opacity', String(opacity));
    }
  }

  function applySunnyFallback(message) {
    applyWeatherTheme({ scene: 'clear', isDay: true, cloudCover: 18 });
    setMetaText(message);
  }

  async function getCoordsByBrowser() {
    if (!navigator.geolocation) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            name: '当前位置',
            source: 'browser'
          });
        },
        () => resolve(null),
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 10 * 60 * 1000
        }
      );
    });
  }

  async function fetchJsonWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function normalizeIpLocation(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const latitude = Number(payload.latitude);
    const longitude = Number(payload.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return {
        latitude,
        longitude,
        name: payload.city || payload.region || payload.country_name || payload.country || 'IP定位',
        source: 'ip'
      };
    }

    return null;
  }

  async function getCoordsByIp() {
    const providers = [
      'https://ipwho.is/',
      'https://ipapi.co/json/'
    ];

    for (const url of providers) {
      try {
        const data = await fetchJsonWithTimeout(url, 5000);
        const location = normalizeIpLocation(data);
        if (location) return location;
      } catch {
        // Try next provider
      }
    }

    return null;
  }

  async function fetchWeather(location) {
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: 'weather_code,is_day,cloud_cover,temperature_2m',
      timezone: 'auto'
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Weather request failed: ${res.status}`);
    const data = await res.json();
    if (!data || !data.current) throw new Error('Invalid weather payload');
    return data;
  }

  function renderFromWeather(locationName, weatherData) {
    const current = weatherData.current;
    const code = Number(current.weather_code);
    const isDay = Number(current.is_day) === 1;
    const cloudCover = Number(current.cloud_cover);
    const temperature = Number(current.temperature_2m);

    const type = classifyWeatherCode(code);
    applyWeatherTheme({ scene: type.scene, isDay, cloudCover });

    const tempText = Number.isFinite(temperature) ? `${Math.round(temperature)}°C` : '--';
    setMetaText(`${locationName} · ${type.label} · ${tempText}`);
  }

  async function updateWeatherBackground() {
    try {
      setMetaText('正在通过浏览器定位...');

      let currentLocation = await getCoordsByBrowser();
      if (currentLocation) {
        const weatherData = await fetchWeather(currentLocation);
        renderFromWeather(currentLocation.name, weatherData);
        return;
      }

      setMetaText('浏览器定位失败，正在切换IP定位...');
      currentLocation = await getCoordsByIp();
      if (currentLocation) {
        const weatherData = await fetchWeather(currentLocation);
        renderFromWeather(`IP:${currentLocation.name}`, weatherData);
        return;
      }

      applySunnyFallback('定位失败 · 已使用晴天背景');
    } catch {
      applySunnyFallback('天气加载失败 · 已使用晴天背景');
    }
  }

  updateWeatherBackground();
  setInterval(updateWeatherBackground, 15 * 60 * 1000);
})();
