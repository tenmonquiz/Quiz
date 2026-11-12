// --- グローバル変数 ---
const TIME_LIMIT = 10;
const KANJI_TIME_LIMIT = 20;
const KANJI_INITIAL_LIVES = 3;
const KANJI_LEVEL_LABELS = {
    beginner: '初級',
    intermediate: '中級',
    advanced: '上級'
};
let currentMode = 'timed'; // 'timed', 'untimed', or 'kanji'
let currentQuestionIndex = 0;
let score = 0;
let advancedScore = 0; 
let quizActive = false;
let shuffledQuizData = [];
let selectedQuizData = [];
let currentLevel = '1';
let currentKanjiLevel = 'beginner';
let startTime = 0;
let timeLeft = TIME_LIMIT;
let timerInterval;
let questionTransitionTimeout;
let userAnswers = [];
let kanjiLives = KANJI_INITIAL_LIVES;
let kanjiIsComposing = false;
let kanjiMissCount = 0;
let kanjiSkippedCount = 0;
let kanjiTimeoutCount = 0;
let kanjiAwaitingNext = false;

// --- イベントリスナー設定 ---
function initEventListeners() {
    //モード選択ボタン
    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.addEventListener('click', () => {
            selectMode(btn.dataset.mode);
        });
    });

    // 難易度選択ボタン
    document.querySelectorAll('.difficulty-button').forEach(btn => {
        btn.addEventListener('click', () => {
            selectDifficulty(btn.dataset.level);
        });
    });

    dom.kanjiLevelButtons.forEach(btn => {
        btn.addEventListener('click', () => selectKanjiLevel(btn.dataset.kanjiLevel));
    });

    document.querySelectorAll('.rank-level-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            fetchAndDisplayRanking(btn.dataset.rankLevel);
        });
    });

    dom.homeButton.addEventListener('click', handleHomeClick);
    dom.startButton.addEventListener('click', startGame);
    dom.showRankingBtns.forEach(btn => btn.addEventListener('click', toggleRankingDisplay));
    dom.closeRankingBtn.addEventListener('click', closeRankingDisplay);
    dom.showAnswersBtn.addEventListener('click', showAnswersList);
    dom.backToResultBtn.addEventListener('click', () => showScreen(dom.resultScreen));
    dom.kanjiAnswerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (kanjiIsComposing) return;
        submitKanjiAnswer();
    });
    dom.kanjiAnswerInput.addEventListener('compositionstart', () => { kanjiIsComposing = true; });
    dom.kanjiAnswerInput.addEventListener('compositionend', () => { kanjiIsComposing = false; });
    dom.kanjiAnswerInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.isComposing && event.keyCode !== 229 && !kanjiIsComposing) {
            event.preventDefault();
            submitKanjiAnswer();
        }
    });
    dom.kanjiSkipButton.addEventListener('click', skipKanjiQuestion);
    dom.kanjiNextQuestionButton.addEventListener('click', proceedToNextKanjiQuestion);

    window.addEventListener('keydown', (event) => {
        if (currentMode !== 'kanji' || !quizActive || event.repeat || kanjiIsComposing || event.isComposing || event.keyCode === 229) return;
        if (event.key.toLowerCase() === 'q' && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            skipKanjiQuestion();
        }
    });
    
    dom.backToModeBtn.addEventListener('click', () => {
        showScreen(dom.modeScreen);
    });
    dom.restartBtn.addEventListener('click', () => {
        if (currentMode === 'kanji') startKanjiGame();
        else returnToHome();
    });
}

// --- ゲームロジック ---

function selectMode(mode) {
    currentMode = mode;
    closeRankingDisplay();

    if (mode === 'kanji') {
        currentLevel = 'GO';
        dom.mainTitle.textContent = '天体観測へGO!';
        dom.startScreenTitle.textContent = '漢字の読み方に挑戦！';
        dom.startScreenDescription.classList.add('hidden');
        dom.kanjiModeSummary.classList.remove('hidden');
        dom.kanjiBeginnerCount.textContent = `${allKanjiQuizData.beginner.length}問`;
        dom.kanjiIntermediateCount.textContent = `${allKanjiQuizData.intermediate.length}問`;
        dom.kanjiAdvancedCount.textContent = `${allKanjiQuizData.advanced.length}問`;
        selectKanjiLevel('beginner');
        dom.homeButton.classList.remove('hidden');
        showScreen(dom.startScreen);
        return;
    }

    dom.kanjiModeSummary.classList.add('hidden');
    if (mode === 'timed') {
        dom.selectedModeDisplay.innerHTML = '<i class="fa-solid fa-bolt"></i> タイムショックモード';
        dom.selectedModeDisplay.className = "text-sm font-bold text-orange-400 mb-4";
    } else {
        dom.selectedModeDisplay.innerHTML = '<i class="fa-solid fa-mug-hot"></i> じっくりモード';
        dom.selectedModeDisplay.className = "text-sm font-bold text-cyan-400 mb-4";
    }
    showScreen(dom.difficultyScreen);
}

function selectKanjiLevel(level) {
    if (!Object.prototype.hasOwnProperty.call(allKanjiQuizData, level)) return;

    currentKanjiLevel = level;
    selectedQuizData = allKanjiQuizData[level];
    const hasQuestions = selectedQuizData.length > 0;

    dom.kanjiQuestionCount.textContent = selectedQuizData.length;
    dom.scoreDisplay.textContent = `0 / ${selectedQuizData.length}`;
    dom.startButton.disabled = !hasQuestions;
    dom.startButton.classList.toggle('opacity-50', !hasQuestions);
    dom.startButton.classList.toggle('cursor-not-allowed', !hasQuestions);
    dom.kanjiLevelButtons.forEach((button) => {
        const isSelected = button.dataset.kanjiLevel === level;
        button.setAttribute('aria-pressed', String(isSelected));
        button.classList.toggle('selected', isSelected);
    });
}

function selectDifficulty(level) {
    dom.kanjiModeSummary.classList.add('hidden');
    dom.startScreenDescription.classList.remove('hidden');
    currentLevel = level;
    
    selectedQuizData = allQuizData[currentLevel];
    const totalQuestions = selectedQuizData.length;
    
    dom.mainTitle.textContent = `レベル${currentLevel}`;
    if (totalQuestions > 0) {
        dom.startScreenTitle.textContent = `全${totalQuestions}問！宇宙の知識を試そう！`;
        dom.startScreenDescription.textContent = "";
        dom.startButton.disabled = false;
        dom.startButton.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        dom.startScreenTitle.textContent = "問題データがありません";
        dom.startScreenDescription.textContent = "js/data.js のレベル0配列に問題を追加してください。";
        dom.startButton.disabled = true;
        dom.startButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
    dom.scoreDisplay.textContent = `0 / ${totalQuestions}`;

    dom.homeButton.classList.remove('hidden');
    showScreen(dom.startScreen);
}

function handleHomeClick() {
    const isQuizInProgress = !dom.quizScreen.classList.contains('hidden');
    if (isQuizInProgress) {
        if (confirm("クイズの進行度は失われます。それでもホームに戻りますか？")) {
            clearInterval(timerInterval);
            returnToHome();
        }
    } else {
        returnToHome();
    }
}

function returnToHome() {
    dom.homeButton.classList.add('hidden');
    dom.mainTitle.textContent = "天文クイズ";
    dom.scoreDisplay.textContent = "0 / 0";
    
    closeRankingDisplay();
    showScreen(dom.modeScreen);

    currentQuestionIndex = 0;
    score = 0;
    quizActive = false;
    currentMode = 'timed';
    currentLevel = '1';
    currentKanjiLevel = 'beginner';
    kanjiLives = KANJI_INITIAL_LIVES;
    kanjiIsComposing = false;
    kanjiMissCount = 0;
    kanjiSkippedCount = 0;
    kanjiTimeoutCount = 0;
    kanjiAwaitingNext = false;
    shuffledQuizData = [];
    userAnswers = [];
    dom.multipleChoiceContent.classList.remove('hidden');
    dom.kanjiQuizContent.classList.add('hidden');
    dom.kanjiModeSummary.classList.add('hidden');
    dom.kanjiExplanationArea.classList.add('hidden');
    dom.kanjiAnswerInput.value = '';
    dom.kanjiAnswerInput.disabled = false;
    dom.kanjiSubmitButton.disabled = false;
    dom.kanjiSkipButton.disabled = false;
    clearInterval(timerInterval);
    clearTimeout(questionTransitionTimeout);
}

function shuffleArray(array) {
    let newArray = array.slice();
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function startGame() {
    if (!selectedQuizData.length) return;
    clearTimeout(questionTransitionTimeout);

    if (currentMode === 'kanji') {
        startKanjiGame();
        return;
    }

    shuffledQuizData = shuffleArray(selectedQuizData);
    currentQuestionIndex = 0;
    score = 0;
    quizActive = true;
    userAnswers = [];
    startTime = Date.now();
    
    updateScoreDisplay();
    displayQuestion();
    showScreen(dom.quizScreen);
}

function displayQuestion() {
    if (currentMode === 'kanji') {
        displayKanjiQuestion();
        return;
    }

    if (currentQuestionIndex >= shuffledQuizData.length) {
        endGame();
        return;
    }
    
    const currentQuiz = shuffledQuizData[currentQuestionIndex];
    dom.questionNumber.textContent = `問題 ${currentQuestionIndex + 1} / ${shuffledQuizData.length}`;
    dom.questionArea.textContent = currentQuiz.question;
    
    dom.choicesArea.innerHTML = ''; 
    
    const shuffledChoices = shuffleArray(currentQuiz.choices);
    shuffledChoices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.className = 'choice-button w-full p-4 rounded-lg text-left shadow-md transition duration-200 text-base md:text-lg active:translate-y-1 bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600';
        
        button.addEventListener('click', () => checkAnswer(choice, button));
        dom.choicesArea.appendChild(button);
    });
    
    quizActive = true;
    dom.feedbackArea.textContent = '';
    
    startTimer();
}

function startKanjiGame() {
    if (!selectedQuizData.length) return;
    clearTimeout(questionTransitionTimeout);

    shuffledQuizData = shuffleArray(selectedQuizData);
    currentQuestionIndex = 0;
    score = 0;
    kanjiLives = KANJI_INITIAL_LIVES;
    kanjiMissCount = 0;
    kanjiSkippedCount = 0;
    kanjiTimeoutCount = 0;
    kanjiAwaitingNext = false;
    quizActive = true;
    userAnswers = [];
    startTime = Date.now();

    dom.multipleChoiceContent.classList.add('hidden');
    dom.kanjiQuizContent.classList.remove('hidden');
    dom.scoreDisplay.textContent = `0 / ${shuffledQuizData.length}`;
    updateKanjiLivesDisplay();
    showScreen(dom.quizScreen);
    displayKanjiQuestion();
}

function displayKanjiQuestion() {
    if (currentQuestionIndex >= shuffledQuizData.length) {
        endGame();
        return;
    }

    const currentQuiz = shuffledQuizData[currentQuestionIndex];
    dom.questionNumber.textContent = `問題 ${currentQuestionIndex + 1} / ${shuffledQuizData.length}`;
    dom.kanjiCharacter.textContent = currentQuiz.kanji;
    dom.kanjiAnswerInput.value = '';
    dom.kanjiAnswerInput.disabled = false;
    dom.kanjiSubmitButton.disabled = false;
    dom.kanjiSkipButton.disabled = false;
    dom.kanjiFeedbackArea.textContent = '';
    dom.kanjiExplanationArea.classList.add('hidden');
    quizActive = true;

    if (window.matchMedia('(min-width: 768px)').matches) {
        dom.kanjiAnswerInput.focus({ preventScroll: true });
    }
    startTimer();
}

function normalizeKanjiReading(reading) {
    return String(reading ?? '')
        .normalize('NFKC')
        .trim()
        .replace(/[\s　]+/g, '')
        .replace(/[\u30a1-\u30f6]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

function submitKanjiAnswer() {
    if (!quizActive) return;
    const reading = dom.kanjiAnswerInput.value;
    if (!normalizeKanjiReading(reading)) {
        dom.kanjiFeedbackArea.textContent = '読み方を入力してください';
        dom.kanjiFeedbackArea.className = 'mt-4 min-h-7 text-center text-lg font-bold text-yellow-300';
        return;
    }
    resolveKanjiQuestion(reading, 'answer');
}

function skipKanjiQuestion() {
    resolveKanjiQuestion(null, 'skip');
}

function resolveKanjiQuestion(selectedReading, outcome) {
    if (!quizActive) return;

    const currentQuiz = shuffledQuizData[currentQuestionIndex];
    const expectedReadings = [currentQuiz.answer, ...(currentQuiz.acceptedAnswers || [])]
        .map(normalizeKanjiReading);
    const isCorrect = outcome === 'answer' && expectedReadings.includes(normalizeKanjiReading(selectedReading));

    if (outcome === 'answer' && !isCorrect) {
        kanjiMissCount++;
        dom.kanjiFeedbackArea.textContent = '読みが違います。';
        dom.kanjiFeedbackArea.className = 'mt-4 min-h-7 text-center text-base font-bold text-orange-300';
        dom.kanjiAnswerInput.select();
        return;
    }

    quizActive = false;
    clearInterval(timerInterval);
    const isTimeUp = outcome === 'timeout';
    const isSkipped = outcome === 'skip';

    userAnswers.push({
        questionData: currentQuiz,
        selectedChoice: selectedReading,
        isCorrect,
        isTimeUp,
        isSkipped
    });

    if (isCorrect) {
        score++;
        dom.kanjiFeedbackArea.textContent = `✅ 正解！ ${currentQuiz.answer}`;
        dom.kanjiFeedbackArea.className = 'mt-4 min-h-7 text-center text-lg font-bold text-green-400';
    } else if (isTimeUp) {
        kanjiLives--;
        kanjiTimeoutCount++;
        dom.kanjiFeedbackArea.textContent = `⏰ 時間切れ！ 正解：${currentQuiz.answer}`;
        dom.kanjiFeedbackArea.className = 'mt-4 min-h-7 text-center text-lg font-bold text-yellow-400';
    } else if (isSkipped) {
        kanjiLives--;
        kanjiSkippedCount++;
        dom.kanjiFeedbackArea.textContent = `スキップ！ 正解：${currentQuiz.answer}`;
        dom.kanjiFeedbackArea.className = 'mt-4 min-h-7 text-center text-lg font-bold text-yellow-300';
    }

    dom.kanjiAnswerInput.disabled = true;
    dom.kanjiSubmitButton.disabled = true;
    dom.kanjiSkipButton.disabled = true;
    updateScoreDisplay();
    updateKanjiLivesDisplay();

    kanjiAwaitingNext = true;
    dom.kanjiExplanationText.textContent = currentQuiz.exp || '解説はありません。';
    dom.kanjiNextQuestionButton.textContent = kanjiLives <= 0 || currentQuestionIndex >= shuffledQuizData.length - 1
        ? '結果を見る'
        : '次の問題へ';
    dom.kanjiExplanationArea.classList.remove('hidden');
}

function updateKanjiLivesDisplay() {
    dom.kanjiLivesCount.textContent = kanjiLives;
    dom.kanjiLivesIcons.textContent = Array.from(
        { length: KANJI_INITIAL_LIVES },
        (_, index) => index < kanjiLives ? '♥' : '♡'
    ).join(' ');
}

function proceedToNextKanjiQuestion() {
    if (!kanjiAwaitingNext) return;
    kanjiAwaitingNext = false;
    dom.kanjiExplanationArea.classList.add('hidden');
    currentQuestionIndex++;

    if (kanjiLives <= 0 || currentQuestionIndex >= shuffledQuizData.length) {
        endGame();
        return;
    }

    displayKanjiQuestion();
}

function startTimer() {
    clearInterval(timerInterval);

    // 💡 じっくりモードの時の処理
    if (currentMode === 'untimed') {
        dom.timeLeftText.textContent = "∞";
        dom.timeLeftText.className = "text-xl text-cyan-400";
        dom.progressBar.className = "h-2.5 rounded-full bg-cyan-500"; 
        dom.progressBar.style.width = '100%';
        return; // タイマーは動かさない
    }
    
    // タイムショックは10秒、漢字モードは20秒
    const questionTimeLimit = currentMode === 'kanji' ? KANJI_TIME_LIMIT : TIME_LIMIT;
    timeLeft = questionTimeLimit;
    dom.timeLeftText.textContent = timeLeft;
    dom.timeLeftText.className = "text-xl text-yellow-400";
    
    dom.progressBar.className = "h-2.5 rounded-full bg-blue-500"; 
    dom.progressBar.style.width = '100%';
    
    setTimeout(() => {
        dom.progressBar.className = "h-2.5 rounded-full bg-blue-500 transition-all duration-1000 ease-linear";
    }, 50);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        dom.timeLeftText.textContent = timeLeft;
        
        const progressPercent = (timeLeft / questionTimeLimit) * 100;
        dom.progressBar.style.width = `${progressPercent}%`;
        
        if(timeLeft <= 5) {
            dom.timeLeftText.className = "text-xl text-red-500 animate-pulse";
            dom.progressBar.className = "h-2.5 rounded-full bg-red-500 transition-all duration-1000 ease-linear";
        }
        
        if (timeLeft <= 0) {
            handleTimeUp();
        }
    }, 1000);
}

function handleTimeUp() {
    if (!quizActive) return;
    if (currentMode === 'kanji') {
        resolveKanjiQuestion(null, 'timeout');
        return;
    }

    quizActive = false;
    clearInterval(timerInterval);
    
    const currentQuiz = shuffledQuizData[currentQuestionIndex];
    
    userAnswers.push({
        questionData: currentQuiz,
        selectedChoice: null,
        isCorrect: false,
        isTimeUp: true
    });
    
    dom.feedbackArea.textContent = '⏰ 時間切れ...';
    dom.feedbackArea.className = 'mt-4 h-6 text-center text-lg font-bold text-yellow-500';
    
    Array.from(dom.choicesArea.children).forEach(button => {
        button.disabled = true;
        if (button.textContent === currentQuiz.answer) {
            button.classList.replace('bg-gray-700', 'bg-green-600');
            button.classList.add('ring-2', 'ring-green-400');
        }
        button.classList.remove('hover:bg-gray-600', 'active:translate-y-1');
    });
    
    questionTransitionTimeout = setTimeout(nextQuestion, 1500);
}

function checkAnswer(selectedChoice, selectedButton) {
    if (!quizActive) return;
    quizActive = false;
    clearInterval(timerInterval);

    const currentQuiz = shuffledQuizData[currentQuestionIndex];
    const isCorrect = selectedChoice === currentQuiz.answer;

    userAnswers.push({
        questionData: currentQuiz,
        selectedChoice: selectedChoice,
        isCorrect: isCorrect,
        isTimeUp: false
    });

    Array.from(dom.choicesArea.children).forEach(button => {
        button.disabled = true;
        button.classList.remove('hover:bg-gray-600', 'active:translate-y-1');
        if (button.textContent === currentQuiz.answer) {
            button.classList.replace('bg-gray-700', 'bg-green-600');
            button.classList.add('ring-2', 'ring-green-400');
        } else if (button === selectedButton && !isCorrect) {
            button.classList.replace('bg-gray-700', 'bg-red-600');
            button.classList.add('ring-2', 'ring-red-400');
        }
    });

    if (isCorrect) {
        score++;
        dom.feedbackArea.textContent = `✅ 正解！！`;
        dom.feedbackArea.className = 'mt-4 h-6 text-center text-lg font-bold text-green-500';
    } else {
        dom.feedbackArea.textContent = '❌ 不正解...';
        dom.feedbackArea.className = 'mt-4 h-6 text-center text-lg font-bold text-red-500';
    }
    
    updateScoreDisplay();
    questionTransitionTimeout = setTimeout(nextQuestion, 1500); 
}

function nextQuestion() {
    currentQuestionIndex++;
    displayQuestion();
}

function endGame() {
    clearTimeout(questionTransitionTimeout);
    dom.progressBar.style.width = '0%';
    dom.kanjiResultStats.classList.add('hidden');
    
    const endTime = Date.now();
    const clearTime = (endTime - startTime) / 1000;
    const total = shuffledQuizData.length;

    if (currentMode === 'kanji') {
        endKanjiGame(total, clearTime);
        return;
    }

    // じっくりモードの時はタイム表示を「無制限」にする
    const formattedTime = currentMode === 'timed' ? formatTime(clearTime) : "無制限";
    
    let titleText = "再度挑戦！！";
    if (score === total) titleText = "満点！Perfect！";
    else if (score >= total * 0.7) titleText = "7割越え！すごい！！";
    
    dom.resultTitle.textContent = titleText; 
    dom.scoreDisplay.textContent = `${score} / ${total}`;
    
    // 💡 シェア文の分岐
    let shareText = "";
    if (currentMode === 'timed') {
        if (score === total) {
            shareText = `天文クイズ⚡タイムショック (レベル${currentLevel}) で【 👑 全問正解達成！！ 👑 】\nクリアタイム: ${formattedTime}\n\nあなたも宇宙博士を目指そう！\n６号館3階でプラネタリウムも開催中⭐️\n\n#千葉工大 #天文研究部 #文化の祭典 #文祭天文クイズ`;
        } else {
            shareText = `天文クイズタイムショック (レベル${currentLevel})\n${score} / ${total} 問正解しました！ (クリアタイム: ${formattedTime})\n\n６号館3階でプラネタリウムも開催中⭐️\n\n#千葉工大 #天文研究部 #文化の祭典 #文祭天文クイズ`;
        }
    } else {
        shareText = `天文クイズ　じっくりモード (レベル${currentLevel})\n${score} / ${total} 問正解しました！\n\n６号館3階でプラネタリウムも開催中⭐️\n\n#千葉工大 #天文研究部 #文化の祭典 #文祭天文クイズ`;
    }
    dom.shareButton.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

    showScreen(dom.resultScreen);

    animateValue(dom.finalScoreText, 0, score, 1000, total, formattedTime);

    // 💡 タイムショックモードでのみランキング登録へ進む
    if (currentMode === 'timed') {
        document.getElementById('result-message').textContent = "また挑戦して、宇宙博士を目指そう！";
        
        setTimeout(() => {
            let userName = prompt("ランキングに登録する名前を入力してください（15文字以内・キャンセル可）\n※今回の結果が登録されます！", "名無しの宇宙博士");
            
            if (userName !== null) {
                userName = userName.trim();
                
                if (userName === "") {
                    userName = "名無しの宇宙博士";
                }
                
                if (userName.length > 15) {
                    userName = userName.substring(0, 15);
                    alert(`名前が長すぎるため、「${userName}」で登録します。`);
                }

                const escapeHTML = (str) => {
                    return str.replace(/[&'`"<>]/g, function(match) {
                        return {
                            '&': '&amp;',
                            "'": '&#x27;',
                            '`': '&#x60;',
                            '"': '&quot;',
                            '<': '&lt;',
                            '>': '&gt;',
                        }[match]
                    });
                }
                const safeUserName = escapeHTML(userName);
				
                sendScoreToGAS(safeUserName, score, currentLevel, clearTime, formattedTime);
            }
        }, 1100);
    } else {
        document.getElementById('result-message').textContent = "（ランキング登録はタイムショック限定です）";
        setTimeout(() => {
            alert("じっくりモードお疲れ様でした！\n解説を読んで知識を深めよう！\n※ランキングへの登録は「タイムショック」のみ可能です。");
        }, 1100);
    }
}

function endKanjiGame(total, clearTime) {
    const completedAllQuestions = currentQuestionIndex >= total;
    const formattedTime = formatTime(clearTime);
    const attemptedQuestions = Math.min(userAnswers.length, total);

    if (kanjiLives <= 0 || !completedAllQuestions) {
        dom.resultTitle.textContent = `${KANJI_LEVEL_LABELS[currentKanjiLevel]}・ゲームオーバー`;
    } else if (score === total) {
        dom.resultTitle.textContent = `${KANJI_LEVEL_LABELS[currentKanjiLevel]}・全問正解！`;
    } else {
        dom.resultTitle.textContent = `${KANJI_LEVEL_LABELS[currentKanjiLevel]}・全問完走！`;
    }

    dom.scoreDisplay.textContent = `${score} / ${total}`;
    dom.resultMessage.textContent = `${attemptedQuestions} / ${total} 問に挑戦しました。`;
    dom.kanjiResultCorrect.textContent = `${score} / ${total}問`;
    dom.kanjiResultMisses.textContent = `${kanjiMissCount}回`;
    dom.kanjiResultUnanswered.textContent = `${kanjiSkippedCount + kanjiTimeoutCount}問`;
    dom.kanjiResultSkipped.textContent = `${kanjiSkippedCount}問`;
    dom.kanjiResultTimeouts.textContent = `${kanjiTimeoutCount}問`;
    dom.kanjiResultLives.textContent = `${kanjiLives} / ${KANJI_INITIAL_LIVES}`;
    dom.kanjiResultTime.textContent = formattedTime;
    dom.shareButton.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `天体観測へGO!・${KANJI_LEVEL_LABELS[currentKanjiLevel]}\n${dom.resultTitle.textContent}　${score} / ${total}問正解\n挑戦 ${attemptedQuestions} / ${total}問　タイム ${formattedTime}`
    )}`;

    dom.kanjiResultStats.classList.remove('hidden');
    showScreen(dom.resultScreen);
    animateValue(dom.finalScoreText, 0, score, 1000, total, formattedTime);
}

// アプリケーション開始
initEventListeners();
