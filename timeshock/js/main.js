// --- グローバル変数 ---
const TIME_LIMIT = 10;
let currentMode = 'timed'; // 追加: 'timed' or 'untimed'
let currentQuestionIndex = 0;
let score = 0;
let advancedScore = 0; 
let quizActive = false;
let shuffledQuizData = [];
let selectedQuizData = [];
let currentLevel = '1';
let startTime = 0;
let timeLeft = TIME_LIMIT;
let timerInterval;
let userAnswers = [];

// --- イベントリスナー設定 ---
function initEventListeners() {
    // 💡 モード選択ボタン
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

    dom.secretButton.addEventListener('click', () => {
        if (confirm("⚠️ 隠しコマンド検出 ⚠️\n\n難易度「レベル 0 (Special)」に挑戦しますか？")) {
            selectDifficulty('0');
        }
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
    
    dom.backToModeBtn.addEventListener('click', () => {
        showScreen(dom.modeScreen);
    });
    dom.restartBtn.addEventListener('click', returnToHome);
}

// --- ゲームロジック ---

function selectMode(mode) {
    currentMode = mode;
    if (mode === 'timed') {
        dom.selectedModeDisplay.innerHTML = '<i class="fa-solid fa-bolt"></i> タイムショックモード';
        dom.selectedModeDisplay.className = "text-sm font-bold text-orange-400 mb-4";
    } else {
        dom.selectedModeDisplay.innerHTML = '<i class="fa-solid fa-mug-hot"></i> じっくりモード';
        dom.selectedModeDisplay.className = "text-sm font-bold text-cyan-400 mb-4";
    }
    closeRankingDisplay();
    showScreen(dom.difficultyScreen);
}

function selectDifficulty(level) {
    currentLevel = level;
    
    selectedQuizData = allQuizData[currentLevel];
    const totalQuestions = selectedQuizData.length;
    
    dom.mainTitle.textContent = `レベル${currentLevel}`;
    dom.startScreenTitle.textContent = `全${totalQuestions}問！宇宙の知識を試そう！`;
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
    // 💡 ホームボタンで戻る先をモード選択画面にする
    showScreen(dom.modeScreen);

    currentQuestionIndex = 0;
    score = 0;
    quizActive = false;
    shuffledQuizData = [];
    userAnswers = [];
    clearInterval(timerInterval);
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
    
    // 以下、タイムショックモードの処理
    timeLeft = TIME_LIMIT;
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
        
        const progressPercent = (timeLeft / TIME_LIMIT) * 100;
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
    
    setTimeout(nextQuestion, 1500);
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
    setTimeout(nextQuestion, 1500); 
}

function nextQuestion() {
    currentQuestionIndex++;
    displayQuestion();
}

function endGame() {
    dom.progressBar.style.width = '0%';
    
    const endTime = Date.now();
    const clearTime = (endTime - startTime) / 1000;
    // じっくりモードの時はタイム表示を「無制限」にする
    const formattedTime = currentMode === 'timed' ? formatTime(clearTime) : "無制限";
    const total = shuffledQuizData.length;
    
    let titleText = "再度挑戦！！";
    if (score === total) titleText = "満点！Perfect！";
    else if (score >= total * 0.7) titleText = "7割越え！すごい！！";
    
    dom.resultTitle.textContent = titleText; 
    dom.scoreDisplay.textContent = `${score} / ${total}`;
    
    // 💡 シェア文の分岐
    let shareText = "";
    if (currentMode === 'timed') {
        if (score === total) {
            shareText = `天文クイズ⚡タイムショック (レベル${currentLevel}) で【 👑 全問正解達成！！ 👑 】\nクリアタイム: ${formattedTime}\n\nあなたも宇宙博士を目指そう！\n６号館4階でプラネタリウムも開催中⭐️\n\n#千葉工大 #天文研究部 #津田沼祭 #第76回津田沼祭 #沼祭天文クイズ`;
        } else {
            shareText = `天文クイズ⚡タイムショック (レベル${currentLevel})\n${score} / ${total} 問正解しました！ (クリアタイム: ${formattedTime})\n\n６号館4階でプラネタリウムも開催中⭐️\n\n#千葉工大 #天文研究部 #津田沼祭 #第76回津田沼祭 #沼祭天文クイズ`;
        }
    } else {
        shareText = `天文クイズ☕じっくりモード (レベル${currentLevel})\n${score} / ${total} 問正解しました！\n\n６号館4階でプラネタリウムも開催中⭐️\n\n#千葉工大 #天文研究部 #津田沼祭 #第76回津田沼祭 #沼祭天文クイズ`;
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
        // じっくりモードの時はアラートを出すだけ
        document.getElementById('result-message').textContent = "（ランキング登録はタイムショック限定です）";
        setTimeout(() => {
            alert("☕ じっくりモードお疲れ様でした！\n解説を読んで知識を深めよう！\n※ランキングへの登録は「タイムショック」のみ可能です。");
        }, 1100);
    }
}

// アプリケーション開始
initEventListeners();