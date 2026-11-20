const SOLAR_SYSTEM_PLANETS = [
    { id: 'mercury', name: '水星', distance: 0.39, color: '#a5b4fc' },
    { id: 'venus', name: '金星', distance: 0.72, color: '#fbbf24' },
    { id: 'earth', name: '地球', distance: 1.00, color: '#38bdf8' },
    { id: 'mars', name: '火星', distance: 1.52, color: '#fb7185' },
    { id: 'jupiter', name: '木星', distance: 5.20, color: '#c084fc' },
    { id: 'saturn', name: '土星', distance: 9.58, color: '#f97316' }
];
const SOLAR_SYSTEM_MAX_AU = 19.2;
const SOLAR_SYSTEM_ZOOM_WIDTH_AU = 1;
let solarSystemPlacements = [];
let solarSystemResult = null;
let solarSystemResultBlobPromise = null;
let solarSystemRoughDistance = 9.6;
let solarSystemSelectedDistance = 9.6;
let solarSystemZoomStart = 9.1;
let solarShareBusy = false;
let solarZoomReturnFocus = null;

function initializeSolarSystemEvents() {
    dom.solarStartButton.addEventListener('click', startSolarSystemGame);
    dom.solarIntroBackButton.addEventListener('click', returnToHome);
    dom.solarConfirmButton.addEventListener('click', confirmSolarSystemPlacement);
    dom.solarDistanceInput.addEventListener('input', handleSolarSystemMainInput);
    dom.solarDistanceInput.addEventListener('pointerdown', revealSolarSystemFineAdjustment);
    dom.solarZoomDistanceInput.addEventListener('input', handleSolarSystemZoomInput);
    window.addEventListener('resize', updateSolarSystemReadout);
    dom.solarShareButton.addEventListener('click', shareSolarSystemResult);
    dom.solarSaveImageButton.addEventListener('click', saveSolarSystemResultImage);
    dom.solarRestartButton.addEventListener('click', startSolarSystemGame);
    dom.solarHomeButton.addEventListener('click', returnToHome);
    dom.solarChartZoomButtons.forEach((button) => {
        button.addEventListener('click', () => openSolarSystemChartZoom(button.dataset.chartZoom));
    });
    dom.solarChartZoomCloseButton.addEventListener('click', closeSolarSystemChartZoom);
    dom.solarChartZoomModal.addEventListener('click', (event) => {
        if (event.target === dom.solarChartZoomModal) closeSolarSystemChartZoom();
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !dom.solarChartZoomModal.classList.contains('hidden')) {
            closeSolarSystemChartZoom();
        }
    });
}

function resetSolarSystemGame() {
    solarSystemPlacements = [];
    solarSystemResult = null;
    solarSystemResultBlobPromise = null;
    solarSystemRoughDistance = 9.6;
    solarSystemSelectedDistance = 9.6;
    solarSystemZoomStart = 9.1;
    dom.solarDistanceInput.value = '9.6';
    dom.solarZoomDistanceInput.value = '0.5';
    dom.solarZoomPreview.classList.add('hidden');
    dom.solarGuessValue.textContent = '9.60';
    dom.solarCurrentMarker.textContent = '';
    dom.solarCurrentMarker.removeAttribute('data-planet');
    dom.solarCurrentMarker.style.setProperty('--solar-position', '50%');
    dom.solarCurrentMarker.style.left = '50%';
    dom.solarCurrentMarker.style.removeProperty('--planet-color');
    dom.solarShareStatus.textContent = '';
    dom.solarChartZoomModal.classList.add('hidden');
    solarZoomReturnFocus = null;
    dom.solarPlayerChart.replaceChildren();
    dom.solarRealChart.replaceChildren();
    dom.solarChartLegend.replaceChildren();
    dom.solarPlanetResults.replaceChildren();
    dom.solarScoreValue.textContent = '0%';
    dom.solarRankName.textContent = '';
    dom.solarRankDescription.textContent = '';
    updateSolarSystemZoomLabels();
}

function startSolarSystemGame() {
    solarSystemPlacements = [];
    solarSystemResult = null;
    solarSystemResultBlobPromise = null;
    solarSystemRoughDistance = 9.6;
    solarSystemSelectedDistance = 9.6;
    dom.solarDistanceInput.value = '9.6';
    dom.solarZoomPreview.classList.add('hidden');
    recenterSolarSystemZoom(solarSystemRoughDistance);
    dom.solarShareStatus.textContent = '';
    showScreen(dom.solarPlayScreen);
    updateSolarSystemReadout();
}

function getSolarSystemInputValue() {
    const parsed = solarSystemSelectedDistance;
    if (!Number.isFinite(parsed)) return 9.6;
    return Math.min(SOLAR_SYSTEM_MAX_AU, Math.max(0, Math.round(parsed * 100) / 100));
}

function handleSolarSystemMainInput() {
    revealSolarSystemFineAdjustment();
    solarSystemRoughDistance = Math.min(SOLAR_SYSTEM_MAX_AU, Math.max(0, Number.parseFloat(dom.solarDistanceInput.value) || 0));
    solarSystemSelectedDistance = Math.round(solarSystemRoughDistance * 100) / 100;
    recenterSolarSystemZoom(solarSystemRoughDistance);
    updateSolarSystemReadout();
}

function revealSolarSystemFineAdjustment() {
    if (solarSystemPlacements.length < SOLAR_SYSTEM_PLANETS.length) {
        dom.solarZoomPreview.classList.remove('hidden');
    }
}

function handleSolarSystemZoomInput() {
    const fineOffset = Number.parseFloat(dom.solarZoomDistanceInput.value) || 0;
    solarSystemSelectedDistance = Math.min(SOLAR_SYSTEM_MAX_AU, Math.max(0, Math.round((solarSystemZoomStart + fineOffset) * 100) / 100));
    updateSolarSystemReadout();
}

function recenterSolarSystemZoom(centerDistance, selectedDistance = centerDistance) {
    const maxStart = SOLAR_SYSTEM_MAX_AU - SOLAR_SYSTEM_ZOOM_WIDTH_AU;
    solarSystemZoomStart = Math.round(Math.min(maxStart, Math.max(0, centerDistance - SOLAR_SYSTEM_ZOOM_WIDTH_AU / 2)) * 100) / 100;
    const fineOffset = Math.min(SOLAR_SYSTEM_ZOOM_WIDTH_AU, Math.max(0, selectedDistance - solarSystemZoomStart));
    dom.solarZoomDistanceInput.value = (Math.round(fineOffset * 100) / 100).toFixed(2);
    updateSolarSystemZoomLabels();
}

function updateSolarSystemZoomLabels() {
    dom.solarZoomStart.textContent = solarSystemZoomStart.toFixed(2);
    dom.solarZoomEnd.textContent = (solarSystemZoomStart + SOLAR_SYSTEM_ZOOM_WIDTH_AU).toFixed(2);
}

function updateSolarSystemReadout() {
    const planet = SOLAR_SYSTEM_PLANETS[solarSystemPlacements.length];
    if (!planet) return;

    const value = getSolarSystemInputValue();
    const roughPercentage = (solarSystemRoughDistance / SOLAR_SYSTEM_MAX_AU) * 100;
    const finePercentage = ((value - solarSystemZoomStart) / SOLAR_SYSTEM_ZOOM_WIDTH_AU) * 100;
    dom.solarStepCount.textContent = `惑星 ${solarSystemPlacements.length + 1} / ${SOLAR_SYSTEM_PLANETS.length}`;
    dom.solarProgressFill.style.width = `${(solarSystemPlacements.length / SOLAR_SYSTEM_PLANETS.length) * 100}%`;
    dom.solarCurrentTitle.textContent = `${planet.name}を配置`;
    dom.solarDistanceInput.setAttribute('aria-valuetext', `大まかな位置 ${solarSystemRoughDistance.toFixed(1)} AU`);
    dom.solarZoomDistanceInput.setAttribute('aria-valuetext', `${value.toFixed(2)} AU`);
    dom.solarGuessValue.textContent = value.toFixed(2);
    dom.solarCurrentMarker.dataset.planet = planet.id;
    dom.solarZoomMarker.dataset.planet = planet.id;
    const inputWidth = dom.solarDistanceInput.getBoundingClientRect().width;
    if (inputWidth > 0) {
        dom.solarCurrentMarker.style.left = `${inputWidth * roughPercentage / 100}px`;
    }
    dom.solarCurrentMarker.style.setProperty('--planet-color', planet.color);
    const zoomWidth = dom.solarZoomDistanceInput.getBoundingClientRect().width;
    if (zoomWidth > 0) {
        dom.solarZoomMarker.style.left = `${zoomWidth * Math.min(100, Math.max(0, finePercentage)) / 100}px`;
    }
    dom.solarZoomMarker.style.setProperty('--planet-color', planet.color);
}

function confirmSolarSystemPlacement() {
    if (solarSystemPlacements.length >= SOLAR_SYSTEM_PLANETS.length) return;
    solarSystemPlacements.push(getSolarSystemInputValue());

    if (solarSystemPlacements.length === SOLAR_SYSTEM_PLANETS.length) {
        finishSolarSystemGame();
        return;
    }

    dom.solarDistanceInput.value = '9.6';
    dom.solarZoomPreview.classList.add('hidden');
    solarSystemRoughDistance = 9.6;
    solarSystemSelectedDistance = 9.6;
    recenterSolarSystemZoom(solarSystemRoughDistance);
    updateSolarSystemReadout();
}

function calculateSolarSystemResult() {
    const planets = SOLAR_SYSTEM_PLANETS.map((planet, index) => {
        const placement = solarSystemPlacements[index];
        const errorRatio = Math.min(1, Math.abs(placement - planet.distance) / planet.distance);
        return {
            ...planet,
            placement,
            absoluteError: Math.abs(placement - planet.distance),
            accuracy: Math.round((1 - errorRatio) * 100),
            errorRatio
        };
    });
    const score = Math.max(0, Math.min(100, Math.round(100 * (1 - planets.reduce((sum, planet) => sum + planet.errorRatio, 0) / planets.length))));
    const rank = getSolarSystemRank(score);
    const earth = getSolarSystemEarthSummary(solarSystemPlacements[2]);
    return { score, rank, earth, planets, placements: solarSystemPlacements.slice() };
}

function getSolarSystemRank(score) {
    if (score >= 95) return { letter: 'S', name: '太陽系の創造主', description: 'もしかして：あなたが創った' };
    if (score >= 85) return { letter: 'A', name: '太陽系案内人', description: '太陽系なんてほぼ庭みたいなものでしょ' };
    if (score >= 70) return { letter: 'B', name: '太陽系男子/女子', description: '太陽系は大体友達🎶' };
    if (score >= 50) return { letter: 'C', name: '地元民', description: 'この辺宇宙船ないとどこも遊ぶところないんだよねぇ' };
    if (score >= 30) return { letter: 'D', name: '最近太陽系に来ました', description: 'もしや太陽系きたばっかり？歓迎するよ' };
    return { letter: 'E', name: '迷子', description: '宇宙旅行は保護者同伴の上で' };
}

function getSolarSystemEarthSummary(distance) {
    const temperatureC = distance > 0 ? 255 / Math.sqrt(distance) - 240.15 : null;
    const roundedTemperature = temperatureC === null ? null : Math.round(temperatureC);
    const temperature = roundedTemperature === null
        ? '算出不可（太陽の中心）'
        : `${roundedTemperature > 0 ? '+' : ''}${roundedTemperature}℃`;
    const survivalProbability = getSolarSystemTemperatureSurvivalProbability(temperatureC);
    const createSummary = (title, description, flux) => ({
        title,
        description,
        flux,
        temperature,
        survivalProbability
    });

    if (distance < 0.3) {
        return createSummary('灼熱の地球', '太陽に近すぎる軌道。地球の11倍を超える日射を受ける世界です。', '約11.11倍以上');
    }
    if (distance < 0.5) {
        return createSummary('超高温の地球', '地球よりずっと太陽に近く、日射量は地球の約4〜11倍です。', '約4〜11.11倍');
    }
    if (distance < 0.7) {
        return createSummary('暑い地球', '地球より太陽に近く、日射量もかなり多い世界です。', '約2.04〜4倍');
    }
    if (distance < 0.9) {
        return createSummary('あたたかい地球', '地球より少し太陽に近め。日射量は地球の約1.2〜2倍です。', '約1.23〜2.04倍');
    }
    if (distance <= 1.1) {
        return createSummary('地球に近い軌道', '地球によく似た距離。日射量も地球にかなり近い世界です。', '約0.83〜1.23倍');
    }
    if (distance <= 1.5) {
        return createSummary('少しひんやりする地球', '太陽から少し離れた軌道。地球より日射量は少なめです。', '約0.44〜0.83倍');
    }
    if (distance <= 2) {
        return createSummary('寒冷な地球', '太陽の光が弱まり、冷え込みが厳しそうな世界です。', '約0.25〜0.44倍');
    }
    if (distance <= 3) {
        return createSummary('冷え込む地球', '地球よりかなり遠く、日射量は地球の4分の1以下です。', '約0.11〜0.25倍');
    }
    if (distance <= 5) {
        return createSummary('氷の地球', '太陽の光は地球の約4〜11%。冷たい外側の世界です。', '約0.04〜0.11倍');
    }
    if (distance <= 10) {
        return createSummary('極寒の地球', '巨大惑星たちの領域。日射量は地球の約1〜4%です。', '約0.01〜0.04倍');
    }
    if (distance <= 15) {
        return createSummary('薄明の地球', '太陽は遠く小さく見え、日射量は地球の1%未満です。', '約0.0044〜0.01倍');
    }
    return createSummary('はるかな地球', '太陽系の外側。地球の約0.3〜0.4%の日射しか届きません。', '約0.0027〜0.0044倍');
}

function getSolarSystemTemperatureSurvivalProbability(temperatureC) {
    if (temperatureC === null) return 0;
    if (temperatureC < 0) return Math.max(0, Math.min(100, Math.round((temperatureC + 50) / 50 * 100)));
    if (temperatureC <= 30) return 100;
    return Math.max(0, Math.min(100, Math.round((60 - temperatureC) / 30 * 100)));
}

function finishSolarSystemGame() {
    solarSystemResult = calculateSolarSystemResult();
    renderSolarSystemResult(solarSystemResult);
    solarSystemResultBlobPromise = createSolarSystemResultBlob();
    solarSystemResultBlobPromise.catch(() => {});
    showScreen(dom.solarResultScreen);
}

function renderSolarSystemResult(result) {
    dom.solarScoreValue.textContent = `${result.score}%`;
    dom.solarRankName.textContent = `${result.rank.letter}ランク　${result.rank.name}`;
    dom.solarRankDescription.textContent = result.rank.description;
    renderSolarSystemChart(dom.solarPlayerChart, result.placements, true);
    renderSolarSystemChart(dom.solarRealChart, SOLAR_SYSTEM_PLANETS.map((planet) => planet.distance), false);

    dom.solarChartLegend.replaceChildren();
    result.planets.forEach((planet, index) => {
        const entry = document.createElement('span');
        entry.className = 'solar-legend-item';
        const orb = document.createElement('span');
        orb.className = 'solar-planet-orb solar-legend-orb';
        orb.dataset.planet = planet.id;
        const label = document.createElement('span');
        label.textContent = `${index + 1} ${planet.name}`;
        entry.append(orb, label);
        dom.solarChartLegend.appendChild(entry);
    });

    dom.solarEarthTitle.textContent = result.earth.title;
    dom.solarEarthDescription.textContent = result.earth.description;
    dom.solarEarthDistance.textContent = `${result.placements[2].toFixed(2)} AU`;
    dom.solarEarthFlux.textContent = result.earth.flux;
    dom.solarEarthTemperature.textContent = result.earth.temperature;
    dom.solarEarthSurvivalProbability.textContent = `${result.earth.survivalProbability}%`;

    dom.solarPlanetResults.replaceChildren();
    result.planets.forEach((planet) => {
        const card = document.createElement('article');
        card.className = 'solar-planet-result-card';
        card.style.setProperty('--planet-color', planet.color);
        const deltaText = `${planet.absoluteError.toFixed(2)} AU`;
        card.innerHTML = `
            <div class="solar-planet-result-heading"><span class="solar-planet-orb solar-planet-symbol" data-planet="${planet.id}" aria-hidden="true"></span><h4>${planet.name}</h4><strong>${planet.accuracy}%</strong></div>
            <div class="solar-planet-result-values"><span>あなた <b>${planet.placement.toFixed(2)} AU</b></span><span>実際 <b>${planet.distance.toFixed(2)} AU</b></span><span>距離誤差 <b>${deltaText}</b></span></div>
        `;
        dom.solarPlanetResults.appendChild(card);
    });

    dom.solarShareStatus.textContent = '';
    dom.solarXShareButton.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getSolarSystemShareText(true))}`;
}

function renderSolarSystemChart(container, distances, isPlayerChart = container === dom.solarPlayerChart) {
    container.replaceChildren();
    container.setAttribute('aria-label', `${isPlayerChart ? 'あなたが配置した' : '実際の'}惑星の距離。横軸は0から19.2天文単位です。`);
    const track = document.createElement('div');
    track.className = 'solar-result-slider-track';
    const sun = document.createElement('span');
    sun.className = 'solar-planet-orb solar-slider-endpoint solar-slider-endpoint-sun';
    sun.dataset.planet = 'sun';
    sun.title = '太陽: 0 AU';
    const uranus = document.createElement('span');
    uranus.className = 'solar-planet-orb solar-slider-endpoint solar-slider-endpoint-uranus';
    uranus.dataset.planet = 'uranus';
    uranus.title = '天王星: 19.2 AU';
    track.append(sun, uranus);
    distances.forEach((distance, index) => {
        const marker = document.createElement('span');
        marker.className = 'solar-planet-orb solar-chart-marker';
        marker.dataset.planet = SOLAR_SYSTEM_PLANETS[index].id;
        marker.style.left = `${Math.min(100, Math.max(0, distance / SOLAR_SYSTEM_MAX_AU * 100))}%`;
        marker.style.setProperty('--planet-color', SOLAR_SYSTEM_PLANETS[index].color);
        marker.title = `${index + 1}. ${SOLAR_SYSTEM_PLANETS[index].name}: ${distance.toFixed(2)} AU`;
        track.appendChild(marker);
    });
    container.appendChild(track);
}

function openSolarSystemChartZoom(chartType) {
    if (!solarSystemResult) return;
    const isPlayerChart = chartType === 'player';
    const distances = isPlayerChart
        ? solarSystemResult.placements
        : SOLAR_SYSTEM_PLANETS.map((planet) => planet.distance);
    solarZoomReturnFocus = document.activeElement;
    dom.solarChartZoomTitle.textContent = isPlayerChart ? 'あなたの太陽系を拡大' : '本来の太陽系を拡大';
    renderSolarSystemChart(dom.solarChartZoomChart, distances, isPlayerChart);
    dom.solarChartZoomViewport.scrollLeft = 0;
    dom.solarChartZoomModal.classList.remove('hidden');
    dom.solarChartZoomCloseButton.focus();
}

function closeSolarSystemChartZoom() {
    if (dom.solarChartZoomModal.classList.contains('hidden')) return;
    dom.solarChartZoomModal.classList.add('hidden');
    if (solarZoomReturnFocus && typeof solarZoomReturnFocus.focus === 'function') {
        solarZoomReturnFocus.focus();
    }
    solarZoomReturnFocus = null;
}

function getSolarSystemShareText(includeUrl = false) {
    const result = solarSystemResult;
    if (!result) return '';
    const lines = [
        '私の太陽系を作ってみた！',
        `正確度：${result.score}%`,
        `称号：${result.rank.name}`,
        `この太陽系の地球は「${result.earth.title}」！`,
        `平均気温の目安：${result.earth.temperature}・生存確率（ゲーム内目安）：${result.earth.survivalProbability}%`
    ];
    const gameUrl = getSolarSystemShareUrl();
    if (includeUrl && gameUrl) lines.push(`あなたも挑戦！ ${gameUrl}`);
    else lines.push('あなたも挑戦してみよう！');
    lines.push('#あなたの太陽系');
    return lines.join('\n');
}

function getSolarSystemShareUrl() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:'
        ? window.location.href
        : '';
}

async function createSolarSystemResultBlob() {
    if (!solarSystemResult) throw new Error('太陽系の結果がありません。');
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1460;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('結果画像を作成できません。');

    const background = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    background.addColorStop(0, '#111827');
    background.addColorStop(0.55, '#172554');
    background.addColorStop(1, '#030712');
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(250, 204, 21, 0.08)';
    context.beginPath();
    context.arc(1010, 95, 240, 0, Math.PI * 2);
    context.fill();
    context.textBaseline = 'top';

    drawSolarCanvasText(context, 'SOLAR SYSTEM CHALLENGE', 72, 52, '700 24px sans-serif', '#facc15');
    drawSolarCanvasText(context, 'あなたの太陽系', 72, 96, '900 56px sans-serif', '#f8fafc');
    drawSolarCanvasText(context, `${solarSystemResult.score}%`, 72, 178, '900 112px sans-serif', '#facc15');
    drawSolarCanvasText(context, '太陽系の正確度', 430, 214, '700 28px sans-serif', '#cbd5e1');
    drawSolarCanvasText(context, `${solarSystemResult.rank.letter}ランク　${solarSystemResult.rank.name}`, 72, 315, '800 36px sans-serif', '#fde68a');

    drawSolarCanvasChart(context, 'あなたの太陽系', solarSystemResult.placements, 72, 390);
    drawSolarCanvasChart(context, '本来の太陽系', SOLAR_SYSTEM_PLANETS.map((planet) => planet.distance), 72, 670);

    drawSolarCanvasText(context, '惑星', 72, 952, '700 24px sans-serif', '#cbd5e1');
    SOLAR_SYSTEM_PLANETS.forEach((planet, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const x = 72 + col * 350;
        const y = 1000 + row * 62;
        drawSolarCanvasPlanetOrb(context, x + 11, y + 15, 12, planet.id);
        drawSolarCanvasText(context, `${index + 1}  ${planet.name}`, x + 34, y, '700 24px sans-serif', '#f8fafc');
    });

    drawSolarCanvasText(context, `この太陽系の地球は「${solarSystemResult.earth.title}」`, 72, 1162, '800 34px sans-serif', '#7dd3fc');
    drawSolarCanvasText(context, `地球の位置 ${solarSystemResult.placements[2].toFixed(2)} AU ・ 日射量 ${solarSystemResult.earth.flux}`, 72, 1220, '500 24px sans-serif', '#e2e8f0');
    drawSolarCanvasText(context, `平均気温 ${solarSystemResult.earth.temperature} ・ 人間の生存確率（ゲーム内目安） ${solarSystemResult.earth.survivalProbability}%`, 72, 1260, '500 24px sans-serif', '#e2e8f0');
    drawSolarCanvasText(context, '横軸は太陽からの距離（0〜19.2 AU、線形縮尺）', 72, 1325, '500 22px sans-serif', '#94a3b8');
    drawSolarCanvasText(context, '#あなたの太陽系', 72, 1380, '800 26px sans-serif', '#facc15');

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('結果画像の書き出しに失敗しました。')), 'image/png');
    });
}

function drawSolarCanvasText(context, text, x, y, font, color) {
    context.font = font;
    context.fillStyle = color;
    context.fillText(text, x, y, 1050);
}

function drawSolarCanvasPlanetOrb(context, x, y, radius, planetId) {
    const palettes = {
        sun: ['#fff7ad', '#f97316', '#7c2d12'],
        mercury: ['#d1d5db', '#71717a', '#27272a'],
        venus: ['#fff2b2', '#d6a545', '#713f12'],
        earth: ['#bae6fd', '#0284c7', '#082f49'],
        mars: ['#fdba74', '#c2410c', '#431407'],
        jupiter: ['#fef3c7', '#b45309', '#78350f'],
        saturn: ['#fef3c7', '#ca8a04', '#78350f'],
        uranus: ['#cffafe', '#38bdf8', '#155e75']
    };
    const [light, mid, shadow] = palettes[planetId];

    if (planetId === 'saturn') {
        context.save();
        context.strokeStyle = 'rgba(226, 196, 139, 0.9)';
        context.lineWidth = Math.max(2, radius * 0.32);
        context.beginPath();
        context.ellipse(x, y, radius * 1.55, radius * 0.52, -0.25, 0, Math.PI * 2);
        context.stroke();
        context.restore();
    }

    const gradient = context.createRadialGradient(x - radius * 0.32, y - radius * 0.34, radius * 0.08, x, y, radius * 1.25);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.22, light);
    gradient.addColorStop(0.68, mid);
    gradient.addColorStop(1, shadow);
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();

    if (planetId === 'jupiter') {
        context.save();
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.clip();
        context.strokeStyle = 'rgba(255, 237, 213, 0.7)';
        context.lineWidth = Math.max(1, radius * 0.18);
        for (const offset of [-0.45, 0.05, 0.48]) {
            context.beginPath();
            context.moveTo(x - radius, y + radius * offset);
            context.lineTo(x + radius, y + radius * offset);
            context.stroke();
        }
        context.restore();
    }
}

function drawSolarCanvasChart(context, heading, distances, x, y) {
    drawSolarCanvasText(context, heading, x, y, '800 30px sans-serif', '#f8fafc');
    const left = x + 105;
    const right = x + 1030;
    const lineY = y + 142;
    drawSolarCanvasText(context, '太陽', x, y + 100, '700 20px sans-serif', '#fde68a');
    drawSolarCanvasText(context, '天王星', right - 8, y + 100, '700 20px sans-serif', '#c4b5fd');
    context.strokeStyle = '#64748b';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(left, lineY);
    context.lineTo(right, lineY);
    context.stroke();
    drawSolarCanvasPlanetOrb(context, left, lineY, 20, 'sun');
    drawSolarCanvasPlanetOrb(context, right, lineY, 8, 'uranus');

    for (let tick = 1; tick < 10; tick++) {
        const tickX = left + (right - left) * tick / 10;
        context.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(tickX, lineY - 10);
        context.lineTo(tickX, lineY + 10);
        context.stroke();
    }

    distances.forEach((distance, index) => {
        const markerX = left + (right - left) * distance / SOLAR_SYSTEM_MAX_AU;
        drawSolarCanvasPlanetOrb(context, markerX, lineY, 7, SOLAR_SYSTEM_PLANETS[index].id);
    });
}

async function saveSolarSystemResultImage() {
    if (!solarSystemResult) return;
    try {
        const blob = await (solarSystemResultBlobPromise || createSolarSystemResultBlob());
        const imageUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = imageUrl;
        downloadLink.download = 'my-solar-system.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
        dom.solarShareStatus.textContent = '結果画像を保存しました。Xへの投稿時に画像を添付できます。';
    } catch (error) {
        console.error('結果画像の保存に失敗しました:', error);
        dom.solarShareStatus.textContent = '結果画像を作成できませんでした。ブラウザを更新してもう一度お試しください。';
    }
}

async function shareSolarSystemResult() {
    if (!solarSystemResult || solarShareBusy) return;
    solarShareBusy = true;
    dom.solarShareButton.disabled = true;
    dom.solarShareStatus.textContent = '共有画像を準備しています…';
    try {
        const blob = await (solarSystemResultBlobPromise || createSolarSystemResultBlob());
        const imageFile = new File([blob], 'my-solar-system.png', { type: 'image/png' });
        const shareData = { title: 'あなたの太陽系', text: getSolarSystemShareText(false) };
        const gameUrl = getSolarSystemShareUrl();
        if (gameUrl) shareData.url = gameUrl;

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
            await navigator.share({ ...shareData, files: [imageFile] });
            dom.solarShareStatus.textContent = '共有メニューを開きました。';
        } else {
            downloadSolarSystemBlob(blob);
            dom.solarShareStatus.textContent = 'この環境では画像付き共有に対応していないため、結果画像を保存しました。Xに画像を添付して投稿してください。';
        }
    } catch (error) {
        if (error?.name === 'AbortError') {
            dom.solarShareStatus.textContent = '共有をキャンセルしました。';
        } else {
            console.error('結果の共有に失敗しました:', error);
            dom.solarShareStatus.textContent = '共有を開けなかったため、結果画像を保存します。';
            try {
                const blob = await (solarSystemResultBlobPromise || createSolarSystemResultBlob());
                downloadSolarSystemBlob(blob);
            } catch (saveError) {
                console.error('共有画像の保存に失敗しました:', saveError);
            }
        }
    } finally {
        solarShareBusy = false;
        dom.solarShareButton.disabled = false;
    }
}

function downloadSolarSystemBlob(blob) {
    const imageUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = imageUrl;
    downloadLink.download = 'my-solar-system.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
}
