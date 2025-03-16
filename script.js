const game = {
  player: { hp: 10, mp: 50, selectedCard: null, defense: 0 },
  ai: { hp: 10, mp: 50, selectedCard: null, defense: 0 },
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
    { name: "治疗术", damage: -3, range: 0, move: 0, mpCost: 3, type: "heal" },
    { name: "后撤", damage: 0, range: 0, move: -2, mpCost: 1, type: "move" },
    {
      name: "闪电链",
      damage: 2,
      range: 3,
      move: 0,
      mpCost: 2,
      type: "attack",
      chain: 2,
    },
    { name: "冲锋", damage: 1, range: 1, move: 3, mpCost: 3, type: "attack" },
  ],
  playerHand: [],
  aiHand: [],
};

function initGame() {
  game.player = { ...game.player, hp: 10, mp: 50, defense: 0 };
  game.ai = { ...game.ai, hp: 10, mp: 50, defense: 0 };
  game.distance = 5;
  game.turn = 1;
  document.getElementById("restart-button").style.display = "none";
  drawCards();
  updateUI();
}

function drawCards() {
  game.playerHand = getUniqueCards(3);
  game.aiHand = getUniqueCards(3);
  game.player.selectedCard = null;
  game.ai.selectedCard = null;
  renderCards();
}

function getUniqueCards(count) {
  const available = [...game.skills];
  const selected = [];
  while (selected.length < count && available.length > 0) {
    const randomIndex = Math.floor(Math.random() * available.length);
    selected.push(available.splice(randomIndex, 1)[0]);
  }
  return selected;
}

function renderCards() {
  const cardSelection = document.getElementById("card-selection");
  cardSelection.innerHTML = "";
  game.playerHand.forEach((card, index) => {
    const cardElement = document.createElement("div");
    cardElement.className = "card";
    cardElement.innerHTML = `
            <div class="card-name">${card.name}</div>
            <div class="card-details">伤害: ${card.damage}</div>
            <div class="card-details">范围: ${card.range}</div>
            <div class="card-details">移动: ${card.move}</div>
            <div class="card-details">蓝量: ${card.mpCost}</div>
        `;
    cardElement.addEventListener("click", () => selectCard(index));
    cardSelection.appendChild(cardElement);
  });
}

function selectCard(index) {
  game.player.selectedCard = index;
  document.querySelectorAll(".card").forEach((card, i) => {
    card.classList.toggle("selected", i === index);
    card.style.pointerEvents = "none";
  });
}

function updateCharacterPositions() {
  const fieldWidth = document.querySelector(".battle-field").offsetWidth;
  const baseOffset = 20;
  const playerX = Math.max(
    0,
    Math.min(
      fieldWidth,
      (fieldWidth * game.distance) / game.maxDistance - baseOffset
    )
  );
  const aiX = Math.max(
    0,
    Math.min(
      fieldWidth,
      fieldWidth - (fieldWidth * game.distance) / game.maxDistance - baseOffset
    )
  );
  document.getElementById("player-character").style.left = `${playerX}px`;
  document.getElementById("ai-character").style.right = `${aiX}px`;
}

function executeSkill(character, card) {
  character.mp -= card.mpCost;
  if (card.move !== 0) {
    const moveValue = character === game.player ? -card.move : card.move;
    game.distance = Math.min(
      game.maxDistance,
      Math.max(0, game.distance + moveValue)
    );
  }
  if (card.type === "attack" && isInRange(card.range)) {
    const target = character === game.player ? game.ai : game.player;
    const damage = Math.max(0, card.damage - target.defense);
    target.hp -= damage;
    target.defense = 0;
  }
  if (card.type === "heal") {
    character.hp = Math.min(10, character.hp - card.damage);
  }
  if (card.type === "defend") {
    character.defense += card.defense;
  }
  playAnimation(character, card.name);
}

function isInRange(range) {
  if (range === "infinite") return true;
  return game.distance <= range;
}

function resolveBattle() {
  const playerCard = game.playerHand[game.player.selectedCard];
  if (!playerCard) {
    alert("请选择一张卡牌！");
    return;
  }
  const validAICards = game.aiHand.filter((card) => game.ai.mp >= card.mpCost);
  if (validAICards.length > 0) {
    game.ai.selectedCard = game.aiHand.indexOf(
      validAICards[Math.floor(Math.random() * validAICards.length)]
    );
  } else {
    game.ai.selectedCard = game.aiHand.indexOf(
      game.aiHand.reduce((a, b) => (a.mpCost < b.mpCost ? a : b))
    );
  }
  const aiCard = game.aiHand[game.ai.selectedCard];
  if (game.player.mp < playerCard.mpCost) {
    alert("蓝量不足！");
    resetTurn();
    return;
  }
  executeSkill(game.player, playerCard);
  if (aiCard && game.ai.mp >= aiCard.mpCost) {
    executeSkill(game.ai, aiCard);
  }
  updateUI();
  if (game.player.hp <= 0 || game.ai.hp <= 0) {
    endGame();
  } else {
    setTimeout(() => {
      game.turn++;
      resetTurn();
    }, 1500);
  }
}

function updateUI() {
  document.getElementById("player-hp").textContent = game.player.hp;
  document.getElementById("player-mp").textContent = game.player.mp;
  document.getElementById("ai-hp").textContent = game.ai.hp;
  document.getElementById("ai-mp").textContent = game.ai.mp;
  document.getElementById("distance").textContent = game.distance;
  document.getElementById("turn-number").textContent = game.turn;
  document.querySelectorAll(".status").forEach((status) => {
    const value = parseInt(status.textContent.split(": ")[1]);
    if (status.classList.contains("hp")) {
      status.style.setProperty("--hp-percent", `${(value / 10) * 100}%`);
    } else {
      status.style.setProperty("--mp-percent", `${(value / 50) * 100}%`);
    }
  });
}

function endGame() {
  document.getElementById("battle-result").innerHTML = `
        ${game.player.hp <= 0 ? "你输了！" : "你赢了！"}<br>
        你的血量: ${game.player.hp}<br>
        敌方血量: ${game.ai.hp}<br>
        点击重来
    `;
  document.getElementById("restart-button").style.display = "block";
  document
    .querySelectorAll(".card")
    .forEach((card) => (card.style.pointerEvents = "none"));
}

function resetGame() {
  document
    .querySelectorAll(".card")
    .forEach((card) => (card.style.pointerEvents = "auto"));
  initGame();
}

document.getElementById("restart-button").addEventListener("click", resetGame);
document
  .getElementById("card-selection")
  .addEventListener("click", resolveBattle);
initGame();

function resetTurn() {
  game.player.selectedCard = null;
  game.ai.selectedCard = null;
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.remove("selected");
    card.style.pointerEvents = "auto";
  });
  drawCards();
  updateUI();
}

function playAnimation(character, skillName) {
  const charElement =
    character === game.player
      ? document.getElementById("player-character")
      : document.getElementById("ai-character");
  switch (skillName) {
    case "前冲":
    case "冲锋":
      charElement.classList.add("dash-forward");
      setTimeout(() => charElement.classList.remove("dash-forward"), 500);
      break;
    case "劈砍":
    case "闪电链":
      charElement.classList.add("attack-slash");
      setTimeout(() => charElement.classList.remove("attack-slash"), 300);
      break;
    case "防守":
      charElement.classList.add("defend");
      setTimeout(() => charElement.classList.remove("defend"), 500);
      break;
  }
}
