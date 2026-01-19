// アプリケーションの状態管理
let state = {
    tournamentTitle: '',
    participants: [],
    matches: [],
    criteria: ['wins', 'winRate', 'goalDiff'],
    nextMatchId: 1
};

// 順位決定要素の日本語名
const criteriaNames = {
    wins: '勝ち数',
    winRate: '勝率',
    goalDiff: '得失点差',
    goalsFor: '得点数',
    goalsAgainst: '失点数',
    points: '勝ち点',
    headToHead: '直接対決'
};

// 初期化
function init() {
    loadState();
    renderTournamentTitle();
    renderParticipants();
    renderCriteria();
    updateCriteriaSelect();
    renderMatches();
    renderMatchesTable();
    renderResultsMatrix();
    renderStandings();
    setupEventListeners();
}

// イベントリスナーの設定
function setupEventListeners() {
    document.getElementById('addParticipant').addEventListener('click', addParticipant);
    document.getElementById('participantName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addParticipant();
    });
    document.getElementById('addCriteria').addEventListener('click', addCriteria);
    document.getElementById('generateMatches').addEventListener('click', generateMatches);
    document.getElementById('listViewBtn').addEventListener('click', () => switchView('list'));
    document.getElementById('tableViewBtn').addEventListener('click', () => switchView('table'));
    document.getElementById('tournamentTitle').addEventListener('input', updateTournamentTitle);
    document.getElementById('tournamentTitle').addEventListener('blur', updateTournamentTitle);
    document.getElementById('resetAll').addEventListener('click', resetAllData);
    document.getElementById('shareResults').addEventListener('click', () => shareAsImage('results'));
    document.getElementById('shareStandings').addEventListener('click', () => shareAsImage('standings'));
    document.getElementById('shareBoth').addEventListener('click', () => shareAsImage('both'));
}

// 全データをリセット
function resetAllData() {
    if (confirm('すべてのデータをリセットしますか？\nこの操作は取り消せません。')) {
        // 状態を初期化
        state = {
            tournamentTitle: '',
            participants: [],
            matches: [],
            criteria: ['wins', 'winRate', 'goalDiff'],
            nextMatchId: 1
        };
        
        // localStorageをクリア
        localStorage.removeItem('leagueState');
        
        // すべての表示を更新
        renderTournamentTitle();
        renderParticipants();
        renderCriteria();
        updateCriteriaSelect();
        renderMatches();
        renderMatchesTable();
        renderResultsMatrix();
        renderStandings();
        
        alert('すべてのデータをリセットしました。');
    }
}

// 大会タイトルの表示
function renderTournamentTitle() {
    const input = document.getElementById('tournamentTitle');
    if (input) {
        input.value = state.tournamentTitle || '';
    }
}

// 大会タイトルの更新
function updateTournamentTitle() {
    const input = document.getElementById('tournamentTitle');
    if (input) {
        state.tournamentTitle = input.value.trim();
        renderResultsMatrix();
        renderStandings();
        saveState();
    }
}

// 表示切り替え
function switchView(viewType) {
    const listView = document.getElementById('matchesList');
    const tableView = document.getElementById('matchesTable');
    const listBtn = document.getElementById('listViewBtn');
    const tableBtn = document.getElementById('tableViewBtn');
    
    if (viewType === 'list') {
        listView.style.display = 'block';
        tableView.style.display = 'none';
        listBtn.classList.add('active');
        tableBtn.classList.remove('active');
    } else {
        listView.style.display = 'none';
        tableView.style.display = 'block';
        listBtn.classList.remove('active');
        tableBtn.classList.add('active');
        renderMatchesTable();
    }
}

// 参加者の追加
function addParticipant() {
    const input = document.getElementById('participantName');
    const name = input.value.trim();
    
    if (name && !state.participants.find(p => p.name === name)) {
        state.participants.push({
            id: Date.now(),
            name: name
        });
        input.value = '';
        renderParticipants();
        renderStandings();
        saveState();
    }
}

// 参加者の削除
function removeParticipant(id) {
    state.participants = state.participants.filter(p => p.id !== id);
    // 関連する対戦も削除
    state.matches = state.matches.filter(m => 
        m.team1Id !== id && m.team2Id !== id
    );
    renderParticipants();
    renderMatches();
    renderStandings();
    saveState();
}

// 参加者名の変更
function updateParticipantName(id, newName) {
    const participant = state.participants.find(p => p.id === id);
    if (participant && newName.trim()) {
        participant.name = newName.trim();
        renderParticipants();
        renderMatches();
        renderStandings();
        saveState();
    }
}

// 参加者リストの表示
function renderParticipants() {
    const container = document.getElementById('participantsList');
    
    if (state.participants.length === 0) {
        container.innerHTML = '<div class="empty-state">参加者を追加してください</div>';
        return;
    }
    
    container.innerHTML = state.participants.map(p => `
        <div class="participant-item">
            <input 
                type="text" 
                value="${escapeHtml(p.name)}" 
                onchange="updateParticipantName(${p.id}, this.value)"
                placeholder="参加者名"
            >
            <button class="btn btn-danger btn-small" onclick="removeParticipant(${p.id})">削除</button>
        </div>
    `).join('');
}

// 順位決定要素のプルダウンを更新
function updateCriteriaSelect() {
    const select = document.getElementById('criteriaSelect');
    if (!select) return;
    
    // すべての要素のリスト
    const allCriteria = [
        { value: 'wins', name: '勝ち数' },
        { value: 'winRate', name: '勝率' },
        { value: 'goalDiff', name: '得失点差' },
        { value: 'goalsFor', name: '得点数' },
        { value: 'goalsAgainst', name: '失点数' },
        { value: 'points', name: '勝ち点（勝3、分1、負0）' },
        { value: 'headToHead', name: '直接対決' }
    ];
    
    // 現在選択されている値を保存
    const currentValue = select.value;
    
    // プルダウンをクリア
    select.innerHTML = '<option value="">要素を選択...</option>';
    
    // 既に設定されていない要素のみを追加
    allCriteria.forEach(criterion => {
        if (!state.criteria.includes(criterion.value)) {
            const option = document.createElement('option');
            option.value = criterion.value;
            option.textContent = criterion.name;
            select.appendChild(option);
        }
    });
    
    // 以前の選択値がまだ有効な場合は復元
    if (currentValue && !state.criteria.includes(currentValue)) {
        select.value = currentValue;
    } else {
        select.value = '';
    }
}

// 順位決定要素の追加
function addCriteria() {
    const select = document.getElementById('criteriaSelect');
    const value = select.value;
    
    if (value && !state.criteria.includes(value)) {
        state.criteria.push(value);
        select.value = '';
        renderCriteria();
        updateCriteriaSelect();
        renderStandings();
        saveState();
    }
}

// 順位決定要素の削除
function removeCriteria(index) {
    state.criteria.splice(index, 1);
    renderCriteria();
    updateCriteriaSelect();
    renderStandings();
    saveState();
}

// 順位決定要素の順番変更
function moveCriteria(fromIndex, toIndex) {
    const item = state.criteria.splice(fromIndex, 1)[0];
    state.criteria.splice(toIndex, 0, item);
    renderCriteria();
    updateCriteriaSelect();
    renderStandings();
    saveState();
}

// 順位決定要素リストの表示
function renderCriteria() {
    const container = document.getElementById('criteriaList');
    
    if (state.criteria.length === 0) {
        container.innerHTML = '<div class="empty-state">順位決定要素を追加してください</div>';
        return;
    }
    
    container.innerHTML = state.criteria.map((criterion, index) => `
        <div class="criteria-item" draggable="true" 
             ondragstart="dragStart(event, ${index})"
             ondragover="dragOver(event)"
             ondrop="drop(event, ${index})"
             ondragend="dragEnd(event)">
            <span class="criteria-order">${index + 1}</span>
            <span class="drag-handle">☰</span>
            <span>${criteriaNames[criterion]}</span>
            <button class="remove-btn" onclick="removeCriteria(${index})">×</button>
        </div>
    `).join('');
}

// ドラッグ&ドロップ機能
let draggedIndex = null;

function dragStart(e, index) {
    draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function drop(e, dropIndex) {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
        moveCriteria(draggedIndex, dropIndex);
    }
    draggedIndex = null;
}

function dragEnd(e) {
    e.currentTarget.style.opacity = '1';
    draggedIndex = null;
}

// 対戦組み合わせの生成（ラウンドロビン方式）
function generateMatches() {
    if (state.participants.length < 2) {
        alert('参加者は最低2人必要です');
        return;
    }
    
    state.matches = [];
    const participants = [...state.participants];
    const n = participants.length;
    
    // 参加者が奇数の場合、バイ（休み）を追加して偶数にする
    const teams = participants.map(p => p.id);
    if (n % 2 === 1) {
        teams.push(null); // バイ（休み）
    }
    
    const numRounds = teams.length - 1;
    const matchesPerRound = teams.length / 2;
    
    // ラウンドロビン方式で対戦を生成
    for (let round = 1; round <= numRounds; round++) {
        // 各ラウンドで、各参加者が1回だけ登場するようにペアリング
        for (let i = 0; i < matchesPerRound; i++) {
            const team1Id = teams[i];
            const team2Id = teams[teams.length - 1 - i];
            
            // バイ（休み）の対戦は除外
            if (team1Id !== null && team2Id !== null) {
                state.matches.push({
                    id: state.nextMatchId++,
                    round: round,
                    team1Id: team1Id,
                    team2Id: team2Id,
                    team1Score: null,
                    team2Score: null,
                    completed: false
                });
            }
        }
        
        // 配列を回転（最後の要素を2番目の位置に移動）
        // これにより、次のラウンドで異なる組み合わせが生成される
        const last = teams.pop();
        teams.splice(1, 0, last);
    }
    
    renderMatches();
    renderMatchesTable();
    renderResultsMatrix();
    renderStandings();
    saveState();
}

// 対戦結果の更新
function updateMatchResult(matchId, team1Score, team2Score) {
    const match = state.matches.find(m => m.id === matchId);
    if (match) {
        match.team1Score = team1Score !== '' ? parseInt(team1Score) : null;
        match.team2Score = team2Score !== '' ? parseInt(team2Score) : null;
        match.completed = match.team1Score !== null && match.team2Score !== null;
        renderMatches();
        renderMatchesTable();
        renderResultsMatrix();
        renderStandings();
        saveState();
    }
}

// 対戦リストの表示
function renderMatches() {
    const container = document.getElementById('matchesList');
    
    if (state.matches.length === 0) {
        container.innerHTML = '<div class="empty-state">対戦組み合わせを生成してください</div>';
        return;
    }
    
    // ラウンドごとにグループ化（既存データにroundがない場合は1ラウンドとして扱う）
    const matchesByRound = {};
    state.matches.forEach(match => {
        // 既存データにroundがない場合は、全試合を1ラウンドとして扱う
        const round = match.round !== undefined ? match.round : 1;
        if (!matchesByRound[round]) {
            matchesByRound[round] = [];
        }
        matchesByRound[round].push(match);
    });
    
    let html = '';
    const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
    
    rounds.forEach(round => {
        html += `<div class="round-section">
            <h3 class="round-title">第${round}ラウンド</h3>
            <div class="round-matches">`;
        
        matchesByRound[round].forEach(match => {
            const team1 = state.participants.find(p => p.id === match.team1Id);
            const team2 = state.participants.find(p => p.id === match.team2Id);
            
            if (!team1 || !team2) return;
            
            const team1Score = match.team1Score !== null ? match.team1Score : '';
            const team2Score = match.team2Score !== null ? match.team2Score : '';
            
            html += `
                <div class="match-item">
                    <div class="match-team">
                        <span>${escapeHtml(team1.name)}</span>
                        <input 
                            type="number" 
                            min="0" 
                            id="score1-${match.id}"
                            value="${team1Score}"
                            onchange="updateMatchResult(${match.id}, this.value, document.getElementById('score2-${match.id}').value)"
                            placeholder="0"
                        >
                    </div>
                    <div class="match-vs">VS</div>
                    <div class="match-team">
                        <input 
                            type="number" 
                            min="0" 
                            id="score2-${match.id}"
                            value="${team2Score}"
                            onchange="updateMatchResult(${match.id}, document.getElementById('score1-${match.id}').value, this.value)"
                            placeholder="0"
                        >
                        <span>${escapeHtml(team2.name)}</span>
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    });
    
    container.innerHTML = html;
}

// 対戦組み合わせの表形式表示
function renderMatchesTable() {
    const container = document.getElementById('matchesTable');
    
    if (state.matches.length === 0) {
        container.innerHTML = '<div class="empty-state">対戦組み合わせを生成してください</div>';
        return;
    }
    
    // ラウンドごとにグループ化
    const matchesByRound = {};
    state.matches.forEach(match => {
        const round = match.round !== undefined ? match.round : 1;
        if (!matchesByRound[round]) {
            matchesByRound[round] = [];
        }
        matchesByRound[round].push(match);
    });
    
    const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
    const maxMatchesPerRound = Math.max(...Object.values(matchesByRound).map(matches => matches.length));
    
    let html = `
        <table class="matches-schedule-table">
            <thead>
                <tr>
                    <th style="width: 100px;">ラウンド</th>
    `;
    
    // 試合番号のヘッダーを生成
    for (let i = 1; i <= maxMatchesPerRound; i++) {
        html += `<th>試合${i}</th>`;
    }
    
    html += `
                </tr>
            </thead>
            <tbody>
    `;
    
    // 各ラウンドの行を生成
    rounds.forEach(round => {
        const matches = matchesByRound[round];
        html += `<tr>
            <td class="round-cell"><strong>第${round}ラウンド</strong></td>`;
        
        for (let i = 0; i < maxMatchesPerRound; i++) {
            if (i < matches.length) {
                const match = matches[i];
                const team1 = state.participants.find(p => p.id === match.team1Id);
                const team2 = state.participants.find(p => p.id === match.team2Id);
                
                if (team1 && team2) {
                    const team1Score = match.team1Score !== null ? match.team1Score : '';
                    const team2Score = match.team2Score !== null ? match.team2Score : '';
                    const scoreDisplay = match.completed 
                        ? ` (${team1Score} - ${team2Score})` 
                        : '';
                    
                    html += `
                        <td class="match-cell">
                            <div class="table-match-info">
                                <div class="table-match-teams">
                                    <span class="table-team-name">${escapeHtml(team1.name)}</span>
                                    <span class="table-vs">vs</span>
                                    <span class="table-team-name">${escapeHtml(team2.name)}</span>
                                </div>
                                ${scoreDisplay ? `<div class="table-match-score">${scoreDisplay}</div>` : ''}
                            </div>
                        </td>
                    `;
                } else {
                    html += `<td class="match-cell">-</td>`;
                }
            } else {
                html += `<td class="match-cell">-</td>`;
            }
        }
        
        html += `</tr>`;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// 対戦結果一覧表の表示（マトリックス形式）
function renderResultsMatrix() {
    const container = document.getElementById('resultsMatrix');
    
    if (state.participants.length === 0) {
        container.innerHTML = '<div class="empty-state">参加者を追加してください</div>';
        return;
    }
    
    if (state.matches.length === 0) {
        container.innerHTML = '<div class="empty-state">対戦組み合わせを生成してください</div>';
        return;
    }
    
    // 対戦結果をマップに格納（team1Id vs team2Id の形式で保存）
    const resultsMap = {};
    state.matches.forEach(match => {
        if (match.completed) {
            const key1 = `${match.team1Id}-${match.team2Id}`;
            const key2 = `${match.team2Id}-${match.team1Id}`;
            resultsMap[key1] = {
                team1Score: match.team1Score,
                team2Score: match.team2Score
            };
            resultsMap[key2] = {
                team1Score: match.team2Score,
                team2Score: match.team1Score
            };
        }
    });
    
    const titleDisplay = state.tournamentTitle ? `<div class="tournament-title-display">${escapeHtml(state.tournamentTitle)}</div>` : '';
    
    let html = titleDisplay + `
        <div class="results-matrix-wrapper">
            <table class="results-matrix-table">
                <thead>
                    <tr>
                        <th class="matrix-corner"></th>
    `;
    
    // ヘッダー行（横軸の参加者名）
    state.participants.forEach(participant => {
        html += `<th class="matrix-header">${escapeHtml(participant.name)}</th>`;
    });
    
    html += `
                    </tr>
                </thead>
                <tbody>
    `;
    
    // 各行（縦軸の参加者名と対戦結果）
    state.participants.forEach(rowParticipant => {
        html += `<tr>
            <td class="matrix-header">${escapeHtml(rowParticipant.name)}</td>`;
        
        state.participants.forEach(colParticipant => {
            if (rowParticipant.id === colParticipant.id) {
                // 自分自身との対戦
                html += `<td class="matrix-cell matrix-self">-</td>`;
            } else {
                const key = `${rowParticipant.id}-${colParticipant.id}`;
                const result = resultsMap[key];
                
                if (result) {
                    // 対戦結果がある場合
                    let resultSymbol = '';
                    let resultClass = '';
                    
                    if (result.team1Score > result.team2Score) {
                        resultSymbol = '◯';
                        resultClass = 'matrix-win';
                    } else if (result.team1Score < result.team2Score) {
                        resultSymbol = '✕';
                        resultClass = 'matrix-loss';
                    } else {
                        resultSymbol = '△';
                        resultClass = 'matrix-draw';
                    }
                    
                    html += `<td class="matrix-cell ${resultClass}">
                        <div class="matrix-result-content">
                            <span class="matrix-symbol">${resultSymbol}</span>
                            <span class="matrix-score">${result.team1Score} - ${result.team2Score}</span>
                        </div>
                    </td>`;
                } else {
                    // 未対戦
                    html += `<td class="matrix-cell matrix-empty">-</td>`;
                }
            }
        });
        
        html += `</tr>`;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div class="matrix-legend">
            <span class="legend-item"><span class="legend-symbol matrix-win">◯</span> 勝ち</span>
            <span class="legend-item"><span class="legend-symbol matrix-draw">△</span> 引き分け</span>
            <span class="legend-item"><span class="legend-symbol matrix-loss">✕</span> 負け</span>
            <span class="legend-item"><span class="legend-symbol">-</span> 未対戦</span>
        </div>
    `;
    
    container.innerHTML = html;
}

// 統計データの計算
function calculateStats() {
    const stats = {};
    
    state.participants.forEach(p => {
        stats[p.id] = {
            id: p.id,
            name: p.name,
            wins: 0,
            losses: 0,
            draws: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            matches: 0
        };
    });
    
    state.matches.forEach(match => {
        if (match.completed) {
            const team1 = stats[match.team1Id];
            const team2 = stats[match.team2Id];
            
            if (team1 && team2) {
                team1.matches++;
                team2.matches++;
                team1.goalsFor += match.team1Score;
                team1.goalsAgainst += match.team2Score;
                team2.goalsFor += match.team2Score;
                team2.goalsAgainst += match.team1Score;
                
                if (match.team1Score > match.team2Score) {
                    team1.wins++;
                    team2.losses++;
                } else if (match.team1Score < match.team2Score) {
                    team1.losses++;
                    team2.wins++;
                } else {
                    team1.draws++;
                    team2.draws++;
                }
            }
        }
    });
    
    return stats;
}

// 直接対決の結果を取得（team1Idとteam2Idの対戦結果）
// 戻り値: 1 = team1の勝ち, -1 = team2の勝ち, 0 = 引き分けまたは未対戦
function getHeadToHeadResult(team1Id, team2Id) {
    const match = state.matches.find(m => 
        m.completed && 
        ((m.team1Id === team1Id && m.team2Id === team2Id) ||
         (m.team1Id === team2Id && m.team2Id === team1Id))
    );
    
    if (!match) return 0;
    
    // team1Idがteam1側かteam2側かを判定
    if (match.team1Id === team1Id) {
        if (match.team1Score > match.team2Score) return 1;
        if (match.team1Score < match.team2Score) return -1;
        return 0;
    } else {
        if (match.team2Score > match.team1Score) return 1;
        if (match.team2Score < match.team1Score) return -1;
        return 0;
    }
}

// 順位表の表示
function renderStandings() {
    const container = document.getElementById('standingsTable');
    
    if (state.participants.length === 0) {
        container.innerHTML = '<div class="empty-state">参加者を追加してください</div>';
        return;
    }
    
    const stats = calculateStats();
    const participants = Object.values(stats);
    
    // 各参加者の追加データを計算
    participants.forEach(p => {
        p.winRate = p.matches > 0 ? (p.wins / p.matches) : 0;
        p.goalDiff = p.goalsFor - p.goalsAgainst;
        p.points = p.wins * 3 + p.draws;
    });
    
    // 順位決定要素に基づいてソート
    participants.sort((a, b) => {
        for (const criterion of state.criteria) {
            let diff = 0;
            
            switch (criterion) {
                case 'wins':
                    diff = b.wins - a.wins;
                    break;
                case 'winRate':
                    diff = b.winRate - a.winRate;
                    break;
                case 'goalDiff':
                    diff = b.goalDiff - a.goalDiff;
                    break;
                case 'goalsFor':
                    diff = b.goalsFor - a.goalsFor;
                    break;
                case 'goalsAgainst':
                    diff = a.goalsAgainst - b.goalsAgainst;
                    break;
                case 'points':
                    diff = b.points - a.points;
                    break;
                case 'headToHead':
                    // 直接対決の結果を取得（aがbに勝っていれば正の値）
                    const headToHead = getHeadToHeadResult(a.id, b.id);
                    diff = -headToHead; // ソートでは逆順にする（勝った方が上位）
                    break;
            }
            
            if (diff !== 0) return diff;
        }
        
        return 0;
    });
    
    if (participants.length === 0) {
        container.innerHTML = '<div class="empty-state">データがありません</div>';
        return;
    }
    
    const titleDisplay = state.tournamentTitle ? `<div class="tournament-title-display">${escapeHtml(state.tournamentTitle)}</div>` : '';
    
    let html = titleDisplay + `
        <table>
            <thead>
                <tr>
                    <th style="width: 60px;">順位</th>
                    <th>参加者</th>
                    <th>試合数</th>
                    <th>勝</th>
                    <th>分</th>
                    <th>負</th>
                    <th>得点</th>
                    <th>失点</th>
                    <th>得失点差</th>
                    <th>勝率</th>
                    <th>勝ち点</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    participants.forEach((p, index) => {
        const rank = index + 1;
        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
        
        html += `
            <tr>
                <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                <td style="text-align: left; font-weight: 600;">${escapeHtml(p.name)}</td>
                <td>${p.matches}</td>
                <td>${p.wins}</td>
                <td>${p.draws}</td>
                <td>${p.losses}</td>
                <td>${p.goalsFor}</td>
                <td>${p.goalsAgainst}</td>
                <td>${p.goalDiff >= 0 ? '+' : ''}${p.goalDiff}</td>
                <td>${(p.winRate * 100).toFixed(1)}%</td>
                <td><strong>${p.points}</strong></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 画像として共有
async function shareAsImage(type) {
    try {
        let element;
        let filename;
        
        if (type === 'results') {
            element = document.querySelector('.results-matrix-container');
            filename = state.tournamentTitle 
                ? `${state.tournamentTitle}_対戦結果一覧.png`
                : '対戦結果一覧.png';
        } else if (type === 'standings') {
            element = document.querySelector('.standings-table');
            filename = state.tournamentTitle 
                ? `${state.tournamentTitle}_順位表.png`
                : '順位表.png';
        } else if (type === 'both') {
            // 両方を結合
            const resultsElement = document.querySelector('.results-matrix-container');
            const standingsElement = document.querySelector('.standings-table');
            
            if (!resultsElement || !standingsElement) {
                alert('対戦結果一覧と順位表の両方が必要です。');
                return;
            }
            
            // 両方の画像を生成
            const resultsCanvas = await html2canvas(resultsElement, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false
            });
            
            const standingsCanvas = await html2canvas(standingsElement, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false
            });
            
            // 結合したキャンバスを作成
            const combinedCanvas = document.createElement('canvas');
            combinedCanvas.width = Math.max(resultsCanvas.width, standingsCanvas.width);
            combinedCanvas.height = resultsCanvas.height + standingsCanvas.height + 40; // 40pxの余白
            
            const ctx = combinedCanvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
            
            // 対戦結果一覧を描画
            ctx.drawImage(resultsCanvas, 0, 0);
            
            // 順位表を描画（対戦結果一覧の下に）
            ctx.drawImage(standingsCanvas, 0, resultsCanvas.height + 40);
            
            // ダウンロード
            combinedCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = state.tournamentTitle 
                    ? `${state.tournamentTitle}_対戦結果と順位表.png`
                    : '対戦結果と順位表.png';
                a.click();
                URL.revokeObjectURL(url);
            });
            
            return;
        }
        
        if (!element) {
            alert('表示するデータがありません。');
            return;
        }
        
        // html2canvasで画像化
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        });
        
        // 画像をダウンロード
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        });
        
    } catch (error) {
        console.error('画像生成エラー:', error);
        alert('画像の生成に失敗しました。');
    }
}

// 状態の保存
function saveState() {
    localStorage.setItem('leagueState', JSON.stringify(state));
}

// 状態の読み込み
function loadState() {
    const saved = localStorage.getItem('leagueState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state = {
                ...state,
                ...parsed,
                nextMatchId: parsed.nextMatchId || 1
            };
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }
}

// グローバル関数としてエクスポート（HTMLから呼び出すため）
window.addParticipant = addParticipant;
window.removeParticipant = removeParticipant;
window.updateParticipantName = updateParticipantName;
window.addCriteria = addCriteria;
window.removeCriteria = removeCriteria;
window.moveCriteria = moveCriteria;
window.dragStart = dragStart;
window.dragOver = dragOver;
window.drop = drop;
window.dragEnd = dragEnd;
window.updateMatchResult = updateMatchResult;

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', init);
