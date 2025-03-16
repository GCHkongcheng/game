// 游戏对象声明（提升到最顶部）
const game = {
  player: {
    hp: 10,
    mp: 50,
    selectedCard: null,
    defense: 0,
  },
  ai: {
    hp: 10,
    mp: 50,
    selectedCard: null,
    defense: 0,
  },
  distance: 5,
  maxDistance: 10,
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

  // // 移除旧的点击事件
  // document.querySelectorAll(".card").forEach((card) => {
  //   card.removeEventListener("click", selectCard);
  // });

  // // 重新绑定事件
  // document.querySelectorAll(".card").forEach((card) => {
  //   card.addEventListener("click", selectCard);
  // });
}

// 抽取卡牌
function drawCards() {
  game.player.defense = 0;
  game.ai.defense = 0;
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

// 修改renderCards函数，添加事件绑定
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

    // 新增事件绑定
    cardElement.addEventListener("click", selectCard);

    if (game.player.selectedCard === index) {
      cardElement.classList.add("selected");
    }

    cardSelection.appendChild(cardElement);
  });
}

// 选择卡牌（添加安全判断）
function selectCard(event) {
  if (!game) return;

  const index = parseInt(event.currentTarget.dataset.index);
  document
    .querySelectorAll(".card")
    .forEach((card) => card.classList.remove("selected"));
  game.player.selectedCard = index;
  event.currentTarget.classList.add("selected");

  if (game.player.selectedCard !== null) {
    aiSelectCard();
  }
}

// AI选择卡牌
function aiSelectCard() {
  game.ai.selectedCard = Math.floor(Math.random() * game.aiHand.length);

  if (game.player.selectedCard !== null && game.ai.selectedCard !== null) {
    resolveBattle();
  }
}

// 结算战斗（添加初始化保护）
function resolveBattle() {
  if (!game || !game.player || !game.ai) return;

  const playerCard = game.playerHand[game.player.selectedCard];
  const aiCard = game.aiHand[game.ai.selectedCard];

  if (game.player.mp < playerCard.mpCost || game.ai.mp < aiCard.mpCost) {
    alert("蓝量不足，无法使用该技能！");
    game.player.selectedCard = null;
    game.ai.selectedCard = null;
    renderCards();
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

  setTimeout(() => {
    game.turn++;
    document.getElementById("result-display").style.display = "none";
    drawCards();
    renderCards();
    updateUI();
  }, 1500);
}

// 执行技能
function executeSkill(character, card) {
  character.mp -= card.mpCost;

  if (card.type === "attack") {
    const distance = game.distance;
    const target = character === game.player ? game.ai : game.player;

    if (card.range === "infinite" || distance <= card.range) {
      let finalDamage = card.damage - (target.defense || 0);
      finalDamage = Math.max(0, finalDamage);
      target.hp -= finalDamage;

      target.defense = 0;

      // 修改executeSkill函数中的前冲逻辑
      if (card.name === "前冲") {
        // 统一计算方式：无论玩家还是AI使用前冲，都缩短距离
        const newDistance = game.distance - card.move;

        // 玩家使用前冲：确保不小于0
        if (character === game.player) {
          game.distance = Math.max(0, newDistance);
        }
        // AI使用前冲：确保不大于maxDistance
        else {
          game.distance = Math.min(game.maxDistance, newDistance);
        }
      }

      // 技能动画
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
  document.getElementById("distance").textContent = game.distance;
  document.getElementById("turn-number").textContent = game.turn;
  updateCharacterPositions();
  // 新增进度条效果
  document.querySelectorAll(".status").forEach((status) => {
    if (status.classList.contains("hp")) {
      const current = parseInt(status.textContent);
      const max = 10; // 根据实际最大值调整
      status.style.setProperty("--hp-percent", `${(current / max) * 100}%`);
    }
    if (status.classList.contains("mp")) {
      const current = parseInt(status.textContent);
      const max = 50;
      status.style.setProperty("--mp-percent", `${(current / max) * 100}%`);
    }
  });
}

// 更新角色位置（动态计算宽度）
function updateCharacterPositions() {
  const battleField = document.querySelector(".battle-field");
  const fieldWidth = battleField ? battleField.offsetWidth : 300;
  const maxDistance = game.maxDistance;

  const playerLeft = fieldWidth * (game.distance / maxDistance);

  const playerCharacter = document.getElementById("player-character");
  const aiCharacter = document.getElementById("ai-character");

  playerCharacter.style.transition = "left 0.5s ease";
  aiCharacter.style.transition = "left 0.5s ease";

  playerCharacter.style.left = `${playerLeft}px`;
  aiCharacter.style.left = `${fieldWidth - playerLeft}px`;
}

// 结束游戏（禁用交互）
function endGame() {
  const resultDisplay = document.getElementById("result-display");
  resultDisplay.style.display = "block";
  document.querySelectorAll(".card").forEach((card) => {
    card.style.pointerEvents = "none";
  });

  resultDisplay.querySelector("#battle-result").textContent =
    game.player.hp <= 0 ? "游戏结束，你输了！" : "游戏结束，你赢了！";
}

// 启动游戏
initGame();
