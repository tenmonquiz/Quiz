const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxHrdoESDbaT9-8gojaV7FVQMgoDUlAWcicHnsHxZ0Vk7HL2Nk4wjFywxkvaDh_YveT7w/exec";

// ==========================================
// スコア送信処理
// ==========================================
function sendScoreToGAS(name, score, level, time, formattedTime) {
    const postData = { name, score, level, time };
    
    // fetchの返事を待たずに裏側で送信する
    fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(postData)
    }).catch(error => {
        console.error('スコア送信エラー(バックグラウンド):', error);
    });

    alert(`${name}さん (レベル${level}) の結果「${score}問正解」を登録しました！\nランキングをご確認ください。`);
}

// ==========================================
// ランキング取得処理
// ==========================================
function fetchAndDisplayRanking(level) {
    dom.rankingLevelSelect.classList.add('hidden');
    dom.rankingResultDisplay.classList.remove('hidden');
    dom.rankingResultDisplay.innerHTML = `<p class="text-center text-gray-300 py-4">レベル ${level} のランキングを読み込み中...</p>`;

    fetch(`${GAS_WEB_APP_URL}?level=${level}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') throw new Error(data.message);
            
            let html = `<h3 class="text-xl font-bold text-yellow-400 text-center mb-3">🏆 レベル ${level} TOP 10 🏆</h3>`;
            
            html += `
            <div class="text-center mb-4">
                <button onclick="fetchPerfectRanking('${level}')" class="text-sm bg-yellow-600 hover:bg-yellow-500 transition text-white px-3 py-1 rounded-full shadow">
                    👑 満点獲得者(Top30)を見る
                </button>
            </div>`;

            if (data.length === 0) {
                html += '<p class="text-center text-gray-300">データがありません。</p>';
            } else {
                html += '<ol class="list-decimal list-inside space-y-2 text-gray-200">';
                data.forEach((item, index) => {
                    const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : ''));
                    // pts表記を「〇問正解」に修正
                    html += `<li>${medal} <strong>${item.name}</strong>: ${item.score}問正解 (${formatTime(item.time)})</li>`;
                });
                html += '</ol>';
            }
            html += createBackButtons(level, false);
            dom.rankingResultDisplay.innerHTML = html;
        })
        .catch(err => handleRankingError(err));
}

function fetchPerfectRanking(level) {
    dom.rankingResultDisplay.innerHTML = `<p class="text-center text-gray-300 py-4">レベル ${level} の<br>👑満点獲得者を検索中...</p>`;
    
    fetch(`${GAS_WEB_APP_URL}?level=${level}&type=perfect`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') throw new Error(data.message);
            
            let html = `<h3 class="text-xl font-bold text-yellow-400 text-center mb-3">👑 レベル ${level} 満点者 👑</h3>`;
            if (data.length === 0) {
                html += '<p class="text-center text-gray-300">まだ満点者はいません。</p>';
            } else {
                html += '<ol class="list-decimal list-inside space-y-2 text-gray-200">';
                data.forEach(item => {
                    html += `<li><strong>${item.name}</strong> (${formatTime(item.time)})</li>`;
                });
                html += '</ol>';
            }
            html += createBackButtons(level, true);
            dom.rankingResultDisplay.innerHTML = html;
        })
        .catch(err => handleRankingError(err));
}

function createBackButtons(level, isPerfectPage) {
    let html = '';
    if (isPerfectPage) {
        html += `<button onclick="fetchAndDisplayRanking('${level}')" class="mt-4 w-full p-2 bg-blue-600 hover:bg-blue-500 transition text-white font-bold rounded">Top10に戻る</button>`;
    }
    html += '<button onclick="showLevelSelect()" class="mt-2 w-full p-2 bg-gray-600 hover:bg-gray-500 transition text-white font-bold rounded">レベル選択に戻る</button>';
    return html;
}

function handleRankingError(error) {
    console.error(error);
    dom.rankingResultDisplay.innerHTML = `<p class="text-center text-red-500 font-bold">取得失敗</p><button onclick="showLevelSelect()" class="mt-4 w-full p-2 bg-gray-600 hover:bg-gray-500 transition text-white rounded">戻る</button>`;
}