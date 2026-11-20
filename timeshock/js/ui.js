// --- DOM要素の取得 ---
const dom = {
    homeButton: document.getElementById('home-button'),
    modeScreen: document.getElementById('mode-select-screen'),
    quizTypeScreen: document.getElementById('quiz-type-select-screen'),
    difficultyScreen: document.getElementById('difficulty-select-screen'),
    startScreen: document.getElementById('start-screen'),
    quizScreen: document.getElementById('quiz-screen'),
    resultScreen: document.getElementById('result-screen'),
    answersScreen: document.getElementById('answers-screen'),
    solarIntroScreen: document.getElementById('solar-intro-screen'),
    solarPlayScreen: document.getElementById('solar-play-screen'),
    solarResultScreen: document.getElementById('solar-result-screen'),
    scorePanel: document.getElementById('score-panel'),
    solarStartButton: document.getElementById('solar-start-button'),
    solarIntroBackButton: document.getElementById('solar-intro-back-button'),
    solarStepCount: document.getElementById('solar-step-count'),
    solarProgressFill: document.getElementById('solar-progress-fill'),
    solarCurrentTitle: document.getElementById('solar-current-title'),
    solarZoomPreview: document.getElementById('solar-zoom-preview'),
    solarZoomMarker: document.getElementById('solar-zoom-marker'),
    solarZoomStart: document.getElementById('solar-zoom-start'),
    solarZoomEnd: document.getElementById('solar-zoom-end'),
    solarZoomDistanceInput: document.getElementById('solar-zoom-distance-input'),
    solarDistanceInput: document.getElementById('solar-distance-input'),
    solarCurrentMarker: document.getElementById('solar-current-marker'),
    solarRangeTickMarks: document.getElementById('solar-range-tick-marks'),
    solarConfirmButton: document.getElementById('solar-confirm-button'),
    solarScoreValue: document.getElementById('solar-score-value'),
    solarRankName: document.getElementById('solar-rank-name'),
    solarRankDescription: document.getElementById('solar-rank-description'),
    solarPlayerChart: document.getElementById('solar-player-chart'),
    solarRealChart: document.getElementById('solar-real-chart'),
    solarChartLegend: document.getElementById('solar-chart-legend'),
    solarEarthTitle: document.getElementById('solar-earth-title'),
    solarEarthDescription: document.getElementById('solar-earth-description'),
    solarEarthDistance: document.getElementById('solar-earth-distance'),
    solarEarthFlux: document.getElementById('solar-earth-flux'),
    solarEarthTemperature: document.getElementById('solar-earth-temperature'),
    solarPlanetResults: document.getElementById('solar-planet-results'),
    solarChartZoomButtons: document.querySelectorAll('.solar-chart-zoom-button'),
    solarChartZoomModal: document.getElementById('solar-chart-zoom-modal'),
    solarChartZoomTitle: document.getElementById('solar-chart-zoom-title'),
    solarChartZoomCloseButton: document.getElementById('solar-chart-zoom-close'),
    solarChartZoomChart: document.getElementById('solar-chart-zoom-chart'),
    solarChartZoomViewport: document.getElementById('solar-chart-zoom-viewport'),
    solarShareButton: document.getElementById('solar-share-button'),
    solarXShareButton: document.getElementById('solar-x-share-button'),
    solarSaveImageButton: document.getElementById('solar-save-image-button'),
    solarShareStatus: document.getElementById('solar-share-status'),
    solarRestartButton: document.getElementById('solar-restart-button'),
    solarHomeButton: document.getElementById('solar-home-button'),
    
    startButton: document.getElementById('start-button'),
    showRankingBtns: document.querySelectorAll('.show-ranking-btn'), 
    closeRankingBtn: document.getElementById('close-ranking-btn'),
    showAnswersBtn: document.getElementById('show-answers-button'),
    backToResultBtn: document.getElementById('back-to-result-button'),
    backToModeBtn: document.getElementById('back-to-mode-button'), 
    backToModeFromQuizTypeBtn: document.getElementById('back-to-mode-from-quiz-type-button'),
    restartBtn: document.getElementById('restart-button'), 
    
    scoreDisplay: document.getElementById('score-display'),
    questionNumber: document.getElementById('question-number'),
    timeProgressWrap: document.getElementById('time-progress-wrap'),
    timeLeftDisplay: document.getElementById('time-left-display'),
    progressBar: document.getElementById('progress-bar'),
    timeLeftText: document.getElementById('time-left'),
    questionArea: document.getElementById('question-area'),
    photoQuestionMedia: document.getElementById('photo-question-media'),
    photoQuestionImage: document.getElementById('photo-question-image'),
    photoQuestionImageFallback: document.getElementById('photo-question-image-fallback'),
    photoQuestionCredit: document.getElementById('photo-question-credit'),
    photoQuestionCreditText: document.getElementById('photo-question-credit-text'),
    photoQuestionSource: document.getElementById('photo-question-source'),
    photoAnswerForm: document.getElementById('photo-answer-form'),
    photoAnswerInput: document.getElementById('photo-answer-input'),
    photoAnswerSubmit: document.getElementById('photo-answer-submit'),
    choicesArea: document.getElementById('choices-area'),
    feedbackArea: document.getElementById('feedback-area'),
    answersList: document.getElementById('answers-list'),
    selectedModeDisplay: document.getElementById('selected-mode-display'), 
    
    resultTitle: document.getElementById('result-title'),
    finalScoreText: document.getElementById('final-score-text'),
    resultMessage: document.getElementById('result-message'),
    shareButton: document.getElementById('share-button'),

    levelMaxUnlockPopup: document.getElementById('level-max-unlock-popup'),
    levelMaxChallengeButton: document.getElementById('level-max-challenge-button'),
    levelMaxCloseButton: document.getElementById('level-max-close-button'),
    levelMaxDataNote: document.getElementById('level-max-data-note'),
	answersTitle: document.getElementById('answers-title'),
    
    mainTitle: document.querySelector('#quiz-container h1'),
    startScreenTitle: document.getElementById('start-screen').querySelector('h2'),
    startScreenDescription: document.getElementById('start-screen-description'),
    
    rankingDisplayArea: document.getElementById('ranking-display-area'),
    rankingLevelSelect: document.getElementById('ranking-level-select'),
    rankingResultDisplay: document.getElementById('ranking-result-display'),
    secretButton: document.getElementById('secret-button'),

    kanjiModeSummary: document.getElementById('kanji-mode-summary'),
    kanjiLevelButtons: document.querySelectorAll('.kanji-level-button'),
    kanjiBeginnerCount: document.getElementById('kanji-beginner-count'),
    kanjiIntermediateCount: document.getElementById('kanji-intermediate-count'),
    kanjiAdvancedCount: document.getElementById('kanji-advanced-count'),
    kanjiHayauchiCount: document.getElementById('kanji-hayauchi-count'),
    kanjiSecretLevelButton: document.getElementById('kanji-secret-level-button'),
    kanjiSecretLevelOption: document.querySelector('[data-kanji-level="hayauchi"]'),
    multipleChoiceContent: document.getElementById('multiple-choice-content'),
    kanjiQuizContent: document.getElementById('kanji-quiz-content'),
    kanjiLivesCount: document.getElementById('kanji-lives-count'),
    kanjiLivesIcons: document.getElementById('kanji-lives-icons'),
    kanjiQuestionCard: document.querySelector('.kanji-question-card'),
    kanjiCharacter: document.getElementById('kanji-character'),
    kanjiAnswerForm: document.getElementById('kanji-answer-form'),
    kanjiAnswerInput: document.getElementById('kanji-answer-input'),
    kanjiSubmitButton: document.getElementById('kanji-submit-button'),
    kanjiSkipButton: document.getElementById('kanji-skip-button'),
    kanjiFeedbackArea: document.getElementById('kanji-feedback-area'),
    kanjiExplanationArea: document.getElementById('kanji-explanation-area'),
    kanjiExplanationText: document.getElementById('kanji-explanation-text'),
    kanjiResultStats: document.getElementById('kanji-result-stats'),
    kanjiResultCorrect: document.getElementById('kanji-result-correct'),
    kanjiResultMisses: document.getElementById('kanji-result-misses'),
    kanjiResultUnanswered: document.getElementById('kanji-result-unanswered'),
    kanjiResultSkipped: document.getElementById('kanji-result-skipped'),
    kanjiResultTimeouts: document.getElementById('kanji-result-timeouts'),
    kanjiResultLives: document.getElementById('kanji-result-lives'),
    kanjiResultTime: document.getElementById('kanji-result-time')
};

function getPhotoImageUrlCandidates(imagePath) {
    const value = String(imagePath ?? '').trim();
    if (!value) return [];
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return [value];

    try {
        const forms = [...new Set([value, value.normalize('NFC'), value.normalize('NFD')])];
        return forms.map((path) => new URL(path, document.baseURI).href);
    } catch {
        return [value];
    }
}

// --- UI制御関数 ---
function showScreen(screenElement) {
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
    screenElement.classList.remove('hidden');
    window.scrollTo(0, 0);
}

function formatQuizTextHtml(value, showFurigana = false, processFuriganaMarkup = true) {
    const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
    }[character]));
    const text = String(value ?? '');
    const furiganaPattern = /｜([^《｜]+)《([^》]+)》/g;
    let html = '';
    let lastIndex = 0;
    let match;

    while ((match = furiganaPattern.exec(text)) !== null) {
        html += escapeHtml(text.slice(lastIndex, match.index));
        if (!processFuriganaMarkup) {
            html += escapeHtml(match[0]);
        } else {
            html += showFurigana
                ? `<ruby>${escapeHtml(match[1])}<rt>${escapeHtml(match[2])}</rt></ruby>`
                : escapeHtml(match[1]);
        }
        lastIndex = furiganaPattern.lastIndex;
    }

    return html + escapeHtml(text.slice(lastIndex));
}

function stripQuizFurigana(value) {
    return String(value ?? '').replace(/｜([^《｜]+)《([^》]+)》/g, '$1');
}

function quizAnswersEqual(firstAnswer, secondAnswer) {
    return stripQuizFurigana(firstAnswer) === stripQuizFurigana(secondAnswer);
}

function animateValue(obj, start, end, duration, total, formattedTime) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const currentVal = Math.floor(easeOut * (end - start) + start);
        
        // じっくりモード（時間無制限）の場合はタイムを非表示にする
        if (formattedTime === "無制限") {
            obj.innerHTML = `${currentVal} / ${total}`;
        } else {
            obj.innerHTML = `${currentVal} / ${total} <span class="text-2xl text-gray-300">(${formattedTime})</span>`;
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function updateScoreDisplay() {
    dom.scoreDisplay.textContent = `${score} / ${shuffledQuizData.length}`;
}

function formatTime(totalFloatSeconds) {
    const totalIntSeconds = Math.floor(totalFloatSeconds);
    const minutes = Math.floor(totalIntSeconds / 60);
    const seconds = totalIntSeconds % 60;
    return minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
}

// ランキングUI制御
function toggleRankingDisplay() {
    if (!dom.rankingDisplayArea.classList.contains('hidden')) {
        closeRankingDisplay();
    } else {
        showLevelSelect();
        dom.rankingDisplayArea.classList.remove('hidden');
        dom.showRankingBtns.forEach(btn => btn.innerHTML = '🏆 ランキングを閉じる');
    }
}

function closeRankingDisplay() {
    dom.rankingDisplayArea.classList.add('hidden');
    dom.showRankingBtns.forEach(btn => btn.innerHTML = '🏆 ランキングを見る');
}

function showLevelSelect() {
    dom.rankingResultDisplay.classList.add('hidden');
    dom.rankingLevelSelect.classList.remove('hidden');
}

function showAnswersList() {
    if (currentMode === 'kanji') {
        dom.answersTitle.textContent = `解答と解説（天体観測へGO!・${KANJI_LEVEL_LABELS[currentKanjiLevel]}）`;
    } else if (currentMode === 'photo') {
        dom.answersTitle.textContent = '解答と解説（天文写真クイズ）';
    } else {
        dom.answersTitle.textContent = `解答と解説 (レベル ${currentLevel})`;
    }
    
    dom.answersList.innerHTML = '';
    const processFuriganaMarkup = currentMode === 'timed' || currentMode === 'untimed';
    const showFurigana = processFuriganaMarkup && (currentLevel === '0' || currentLevel === '1');
    const formatAnswerText = (value) => formatQuizTextHtml(value, showFurigana, processFuriganaMarkup);
    
    userAnswers.forEach((ans, index) => {
        const item = document.createElement('div');
        item.className = 'bg-gray-800 p-4 rounded-lg text-left text-sm text-gray-200 border border-gray-700';
        
        let statusBadge = '';
        if (ans.isSkipped) {
            statusBadge = '<span class="px-2 py-0.5 bg-gray-600 text-white rounded text-xs font-bold ml-2">スキップ</span>';
        } else if (ans.isTimeUp) {
            statusBadge = '<span class="px-2 py-0.5 bg-yellow-600 text-white rounded text-xs font-bold ml-2">時間切れ</span>';
        } else if (ans.isCorrect) {
            statusBadge = '<span class="px-2 py-0.5 bg-green-600 text-white rounded text-xs font-bold ml-2">正解</span>';
        } else {
            statusBadge = '<span class="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-bold ml-2">不正解</span>';
        }
        
        const userChoiceText = ans.isSkipped ? '（スキップ）' : (ans.isTimeUp ? '（未解答）' : ans.selectedChoice);
        const questionLabel = ans.questionData.kanji
            ? `「${ans.questionData.kanji}」の読み方`
            : ans.questionData.question;
        const correctChoice = ans.questionData.choices?.find(choice =>
            quizAnswersEqual(choice, ans.questionData.answer)
        ) ?? ans.questionData.answer;
        const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;'
        }[character]));
        const photoCredit = ans.questionData.imageCredit ? escapeHtml(ans.questionData.imageCredit) : '';
        const photoSource = ans.questionData.imageSource
            ? `<a href="${escapeHtml(ans.questionData.imageSource)}" target="_blank" rel="noopener noreferrer">画像情報</a>`
            : '';
        const photoCaption = [photoCredit, photoSource].filter(Boolean).join(' ・ ');
        const photoImageCandidates = getPhotoImageUrlCandidates(ans.questionData.image);
        const photoMarkup = ans.questionData.image ? `
            <figure class="answer-photo">
                <img src="${escapeHtml(photoImageCandidates[0] || ans.questionData.image)}" alt="${escapeHtml(ans.questionData.imageAlt || '')}" loading="lazy" decoding="async">
                ${photoCaption ? `<figcaption>${photoCaption}</figcaption>` : ''}
            </figure>
        ` : '';
                                         
        item.innerHTML = `
            <div class="mb-3 border-b border-gray-600 pb-2">
                <span class="text-sky-400 font-bold text-base">Q${index + 1}.</span> 
                <span class="text-base">${formatAnswerText(questionLabel)}</span>
                ${statusBadge}
            </div>
            ${photoMarkup}
            <div class="mb-1">
                <span class="text-gray-400">あなたの解答:</span> 
                <span class="${ans.isCorrect ? 'text-green-400' : (ans.isTimeUp || ans.isSkipped ? 'text-gray-500' : 'text-red-400')} font-bold">
                    ${formatAnswerText(userChoiceText)}
                </span>
            </div>
            <div class="mb-2">
                <span class="text-gray-400">正解:</span> 
                <span class="text-green-400 font-bold">${formatAnswerText(correctChoice)}</span>
            </div>
            <div class="mt-2 bg-gray-700 p-3 rounded text-sm text-gray-300">
                <span class="text-gray-400 text-xs font-bold block mb-1">解説:</span>
                ${formatAnswerText(ans.questionData.exp || '解説はありません。')}
            </div>
        `;
        const answerPhotoImage = item.querySelector('.answer-photo img');
        if (answerPhotoImage) {
            let candidateIndex = 0;
            answerPhotoImage.addEventListener('error', () => {
                candidateIndex++;
                if (candidateIndex < photoImageCandidates.length) {
                    answerPhotoImage.src = photoImageCandidates[candidateIndex];
                }
            });
        }
        dom.answersList.appendChild(item);
    });
    
    showScreen(dom.answersScreen);
}
