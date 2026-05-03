// --- DOM要素の取得 ---
const dom = {
    homeButton: document.getElementById('home-button'),
    modeScreen: document.getElementById('mode-select-screen'), // 追加
    difficultyScreen: document.getElementById('difficulty-select-screen'),
    startScreen: document.getElementById('start-screen'),
    quizScreen: document.getElementById('quiz-screen'),
    resultScreen: document.getElementById('result-screen'),
    answersScreen: document.getElementById('answers-screen'),
    
    startButton: document.getElementById('start-button'),
    showRankingBtns: document.querySelectorAll('.show-ranking-btn'), // 複数対応に変更
    closeRankingBtn: document.getElementById('close-ranking-btn'),
    showAnswersBtn: document.getElementById('show-answers-button'),
    backToResultBtn: document.getElementById('back-to-result-button'),
    backToModeBtn: document.getElementById('back-to-mode-button'), // 追加
    restartBtn: document.getElementById('restart-button'), // aタグからbuttonに変更
    
    scoreDisplay: document.getElementById('score-display'),
    questionNumber: document.getElementById('question-number'),
    progressBar: document.getElementById('progress-bar'),
    timeLeftText: document.getElementById('time-left'),
    questionArea: document.getElementById('question-area'),
    choicesArea: document.getElementById('choices-area'),
    feedbackArea: document.getElementById('feedback-area'),
    answersList: document.getElementById('answers-list'),
    selectedModeDisplay: document.getElementById('selected-mode-display'), // 追加
    
    resultTitle: document.getElementById('result-title'),
    finalScoreText: document.getElementById('final-score-text'),
    shareButton: document.getElementById('share-button'),
    
    mainTitle: document.querySelector('#quiz-container h1'),
    startScreenTitle: document.getElementById('start-screen').querySelector('h2'),
    
    rankingDisplayArea: document.getElementById('ranking-display-area'),
    rankingLevelSelect: document.getElementById('ranking-level-select'),
    rankingResultDisplay: document.getElementById('ranking-result-display'),
    secretButton: document.getElementById('secret-button')
};

// --- UI制御関数 ---
function showScreen(screenElement) {
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
    screenElement.classList.remove('hidden');
    window.scrollTo(0, 0);
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
    dom.answersList.innerHTML = '';
    
    userAnswers.forEach((ans, index) => {
        const item = document.createElement('div');
        item.className = 'bg-gray-800 p-4 rounded-lg text-left text-sm text-gray-200 border border-gray-700';
        
        let statusBadge = '';
        if (ans.isTimeUp) {
            statusBadge = '<span class="px-2 py-0.5 bg-yellow-600 text-white rounded text-xs font-bold ml-2">時間切れ</span>';
        } else if (ans.isCorrect) {
            statusBadge = '<span class="px-2 py-0.5 bg-green-600 text-white rounded text-xs font-bold ml-2">正解</span>';
        } else {
            statusBadge = '<span class="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-bold ml-2">不正解</span>';
        }
        
        const userChoiceText = ans.isTimeUp ? '（未解答）' : ans.selectedChoice;
                                         
        item.innerHTML = `
            <div class="mb-3 border-b border-gray-600 pb-2">
                <span class="text-sky-400 font-bold text-base">Q${index + 1}.</span> 
                <span class="text-base">${ans.questionData.question}</span>
                ${statusBadge}
            </div>
            <div class="mb-1">
                <span class="text-gray-400">あなたの解答:</span> 
                <span class="${ans.isCorrect ? 'text-green-400' : (ans.isTimeUp ? 'text-gray-500' : 'text-red-400')} font-bold">
                    ${userChoiceText}
                </span>
            </div>
            <div class="mb-2">
                <span class="text-gray-400">正解:</span> 
                <span class="text-green-400 font-bold">${ans.questionData.answer}</span>
            </div>
            <div class="mt-2 bg-gray-700 p-3 rounded text-sm text-gray-300">
                <span class="text-gray-400 text-xs font-bold block mb-1">解説:</span>
                ${ans.questionData.exp || '解説はありません。'}
            </div>
        `;
        dom.answersList.appendChild(item);
    });
    
    showScreen(dom.answersScreen);
}