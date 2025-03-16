// 游戏初始化
const game = {
  player: { hp: 10, mp: 50, distance: 5, selectedCard: null },
  ai: { hp: 10, mp: 50, distance: 5, selectedCard: null },
  turn: 1,
  skills: [
    { name: "前冲", damage: 2, range: 2, move: 2, mpCost: 2, type: "attack" },
    {
      name: "防守",
      damage: 0,
      range: 0,
      move: 0,
      mpCost: 1,
      type: "defend",
      defense: 2,
    },
    { name: "劈砍", damage: 3, range: 2, move: 0, mpCost: 2, type: "attack" },
    {
      name: "魔法球",
      damage: 1,
      range: "infinite",
      move: 0,
      mpCost: 1,
      type: "attack",
    },
  ],
  playerHand: [],
  aiHand: [],
};

// 初始化游戏
function initGame() {
  drawCards();
  updateUI();
}

// 抽取卡牌
function drawCards() {
  game.playerHand = [];
  game.aiHand = [];

  for (let i = 0; i < 3; i++) {
    game.playerHand.push(
      game.skills[Math.floor(Math.random() * game.skills.length)]
    );
    game.aiHand.push(
      game.skills[Math.floor(Math.random() * game.skills.length)]
    );
  }

  game.player.selectedCard = null;
  game.ai.selectedCard = null;

  renderCards();
}

// 渲染卡牌
function renderCards() {
  const cardSelection = document.getElementById("card-selection");
  cardSelection.innerHTML = "";

  game.playerHand.forEach((card, index) => {
    const cardElement = document.createElement("div");
    cardElement.className = "card";
    cardElement.dataset.index = index;
    cardElement.innerHTML = `
      <div>${card.name}</div>
      <div>伤害: ${card.damage}</div>
      <div>范围: ${card.range}</div>
      <div>蓝耗: ${card.mpCost}</div>
      ${card.type === "defend" ? `<div>防御: ${card.defense}</div>` : ""}
      ${card.move !== 0 ? `<div>移动: ${card.move}</div>` : ""}
    `;

    if (game.player.selectedCard === index)
      cardElement.classList.add("selected");

    cardElement.addEventListener("click", selectCard);
    cardSelection.appendChild(cardElement);
  });
}

// 选择卡牌
function selectCard(event) {
  const index = parseInt(event.currentTarget.dataset.index);
  document
    .querySelectorAll(".card")
    .forEach((card) => card.classList.remove("selected"));
  game.player.selectedCard = index;
  event.currentTarget.classList.add("selected");

  if (game.player.selectedCard !== null) aiSelectCard();
}

// AI选择卡牌
function aiSelectCard() {
  game.ai.selectedCard = Math.floor(Math.random() * game.aiHand.length);

  if (game.player.selectedCard !== null && game.ai.selectedCard !== null)
    resolveBattle();
}

// 结算战斗
function resolveBattle() {
  const playerCard = game.playerHand[game.player.selectedCard];
  const aiCard = game.aiHand[game.ai.selectedCard];

  if (game.player.mp < playerCard.mpCost || game.ai.mp < aiCard.mpCost) {
    alert("蓝量不足，无法使用该技能！");
    return;
  }

  executeSkill(game.player, playerCard);
  executeSkill(game.ai, aiCard);

  updateUI();

  if (game.player.hp <= 0 || game.ai.hp <= 0) {
    endGame();
    return;
  }

  document.getElementById("battle-result").innerHTML = `
    玩家选择了: ${playerCard.name}<br>
    AI选择了: ${aiCard.name}
  `;

  document.getElementById("result-display").style.display = "block";
}

// 执行技能
function executeSkill(character, card) {
  character.mp -= card.mpCost;

  if (card.type === "attack") {
    const distance = game.player.distance;
    const target = character === game.player ? game.ai : game.player;

    if (card.range === "infinite" || distance <= card.range) {
      target.hp -= card.damage;

      if (card.name === "前冲") {
        character === game.player
          ? (game.player.distance -= card.move)
          : (game.player.distance += card.move);
        game.player.distance = Math.max(0, game.player.distance);
      }

      // 添加技能动画
      const characterElement = document.getElementById(
        character === game.player ? "player-character" : "ai-character"
      );
      if (card.name === "劈砍") {
        characterElement.classList.add("attack-slash");
      } else if (card.name === "前冲") {
        characterElement.classList.add("dash-forward");
      }
    }
  }

  if (card.type === "defend") {
    character.defense = card.defense;
    const characterElement = document.getElementById(
      character === game.player ? "player-character" : "ai-character"
    );
    characterElement.classList.add("defend");
  }

  // 动画结束后移除类
  setTimeout(() => {
    const characterElement = document.getElementById(
      character === game.player ? "player-character" : "ai-character"
    );
    characterElement.classList.remove("attack-slash", "dash-forward", "defend");
  }, 500);
}

// 更新UI
function updateUI() {
  document.getElementById("player-hp").textContent = game.player.hp;
  document.getElementById("player-mp").textContent = game.player.mp;
  document.getElementById("ai-hp").textContent = game.ai.hp;
  document.getElementById("ai-mp").textContent = game.ai.mp;
  document.getElementById("distance").textContent = game.player.distance;
  document.getElementById("turn-number").textContent = game.turn;
  updateCharacterPositions();
}

// 更新角色位置
function updateCharacterPositions() {
  const fieldWidth = 300;
  const maxDistance = 10;
  const playerLeft = fieldWidth * (game.player.distance / maxDistance);

  const playerCharacter = document.getElementById("player-character");
  const aiCharacter = document.getElementById("ai-character");

  playerCharacter.style.transition = "left 0.5s ease";
  aiCharacter.style.transition = "left 0.5s ease";

  playerCharacter.style.left = `${playerLeft}px`;
  aiCharacter.style.left = `${fieldWidth - playerLeft}px`;
}

// 结算战斗
function resolveBattle() {
  const playerCard = game.playerHand[game.player.selectedCard];
  const aiCard = game.aiHand[game.ai.selectedCard];

  if (game.player.mp < playerCard.mpCost || game.ai.mp < aiCard.mpCost) {
    alert("蓝量不足，无法使用该技能！");
    return;
  }

  executeSkill(game.player, playerCard);
  executeSkill(game.ai, aiCard);

  updateUI();

  if (game.player.hp <= 0 || game.ai.hp <= 0) {
    endGame();
    return;
  }

  document.getElementById("battle-result").innerHTML = `
        玩家选择了: ${playerCard.name}<br>
        AI选择了: ${aiCard.name}
    `;

  const resultDisplay = document.getElementById("result-display");
  resultDisplay.style.display = "block";
  resultDisplay.style.opacity = 0;
  setTimeout(() => {
    resultDisplay.style.opacity = 1;
  }, 10);
}

// 结束游戏
function endGame() {
  const resultDisplay = document.getElementById("result-display");
  resultDisplay.style.display = "block";
  resultDisplay.style.opacity = 0;
  document.getElementById("next-turn-btn").style.display = "none";

  setTimeout(() => {
    resultDisplay.style.opacity = 1;
  }, 10);

  resultDisplay.querySelector("#battle-result").textContent =
    game.player.hp <= 0 ? "游戏结束，你输了！" : "游戏结束，你赢了！";
}

// 下一回合
document.getElementById("next-turn-btn").addEventListener("click", () => {
  game.turn++;
  document.getElementById("result-display").style.opacity = 0;
  setTimeout(() => {
    document.getElementById("result-display").style.display = "none";
    drawCards();
    renderCards();
    updateUI();
  }, 500);
});

// 初始化游戏
initGame();
