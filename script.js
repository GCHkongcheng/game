// 游戏基础设置
const MAX_HEALTH = 10;
const MAX_MANA = 10;
const INITIAL_DISTANCE = 5;
const CARDS_PER_ROUND = 3;

// 角色类
class Character {
  constructor(isPlayer) {
    this.isPlayer = isPlayer;
    this.health = MAX_HEALTH;
    this.mana = MAX_MANA;
    this.maxHealth = MAX_HEALTH;
    this.maxMana = MAX_MANA;
    this.frozen = false; // 添加冻结状态
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health <= 0;
  }

  useMana(amount) {
    if (this.mana >= amount) {
      this.mana -= amount;
      return true;
    }
    return false;
  }

  restoreMana(amount) {
    this.mana = Math.min(this.maxMana, this.mana + amount);
  }
}

// 技能卡牌类 - 增加卡牌类型
class SkillCard {
  constructor(id, name, damage, range, movement, manaCost, description, type) {
    this.id = id;
    this.name = name;
    this.damage = damage;
    this.range = range;
    this.movement = movement; // 正值表示后退，负值表示前进
    this.manaCost = manaCost;
    this.description = description;
    this.type = type || this.determineType(damage, movement); // 卡牌类型：attack, move, support
  }

  determineType(damage, movement) {
    if (damage > 0) return "attack";
    if (movement !== 0) return "move";
    return "support";
  }

  canUse(character, distance) {
    return character.mana >= this.manaCost && !character.frozen;
  }

  use(user, target, gameState) {
    if (user.frozen) {
      logMessage(`${user.isPlayer ? "玩家" : "AI"}被冻结，无法行动`);
      user.frozen = false; // 解除冻结状态
      return false;
    }

    if (!user.useMana(this.manaCost)) {
      logMessage(
        `${user.isPlayer ? "玩家" : "AI"}没有足够的蓝量使用${this.name}`
      );
      return false;
    }

    // 应用移动效果
    if (this.movement !== 0) {
      let movementEffect = this.movement;
      let newDistance = gameState.distance + movementEffect;

      // 检查是否超出边界
      if (newDistance < 0) {
        // 实现穿越逻辑 - 出现在对方身后
        logMessage(`${user.isPlayer ? "玩家" : "AI"}穿越到了对方身后!`);
        newDistance = 0;
        // 穿越造成额外伤害
        if (this.damage > 0) {
          const extraDamage = 1;
          target.takeDamage(extraDamage);
          logMessage(`穿越攻击造成额外${extraDamage}点伤害!`);
        }
      } else if (newDistance > gameState.maxDistance) {
        newDistance = gameState.maxDistance;
        logMessage(`${user.isPlayer ? "玩家" : "AI"}已经退到了边界!`);
      }

      // 更新游戏距离
      gameState.distance = newDistance;

      // 更新角色位置
      updateCharacterPositions(gameState);

      // 根据movement的正负值决定动作描述
      const actionType = this.movement > 0 ? "后退" : "前进";
      logMessage(
        `${user.isPlayer ? "玩家" : "AI"}使用${
          this.name
        }${actionType}了${Math.abs(this.movement)}格，当前距离: ${
          gameState.distance
        }`
      );
    }

    // 检查是否可以造成伤害
    if (this.damage > 0 && this.range >= gameState.distance) {
      const isDead = target.takeDamage(this.damage);
      logMessage(
        `${user.isPlayer ? "玩家" : "AI"}使用${this.name}对${
          user.isPlayer ? "AI" : "玩家"
        }造成了${this.damage}点伤害`
      );
      return isDead;
    } else if (this.damage > 0) {
      logMessage(
        `${user.isPlayer ? "玩家" : "AI"}使用${this.name}但距离过远无法造成伤害`
      );
    }

    // 处理治疗效果
    if (this.damage < 0) {
      user.health = Math.min(user.maxHealth, user.health - this.damage);
      logMessage(
        `${user.isPlayer ? "玩家" : "AI"}使用${this.name}恢复了${-this
          .damage}点生命`
      );
    }

    // 处理魔力恢复效果
    if (this.manaCost === 0) {
      user.restoreMana(2);
      logMessage(
        `${user.isPlayer ? "玩家" : "AI"}使用${this.name}恢复了2点蓝量`
      );
    }

    // 处理冰冻效果
    if (this.name === "冰冻") {
      target.frozen = true;
      logMessage(`${user.isPlayer ? "玩家" : "AI"}冻结了对手一回合`);
    }

    return false;
  }
}

// 更新角色位置的函数
function updateCharacterPositions(gameState) {
  const battleArea = document.querySelector(".battle-area");
  const player = document.querySelector(".player");
  const ai = document.querySelector(".ai");

  if (!battleArea || !player || !ai) return;

  const areaWidth = battleArea.clientWidth;
  const maxGap = areaWidth * 0.8; // 最大间隔为战斗区域的80%

  // 计算间隔距离
  const currentDistance = gameState.distance; // 使用临时变量
  const gap = (gameState.distance / gameState.maxDistance) * maxGap;

  // 更新角色位置
  player.style.left = `${(areaWidth - gap) / 2 - 25}px`; // 25是角色宽度的一半
  ai.style.left = `${(areaWidth + gap) / 2 - 25}px`;

  // 更新距离显示元素
  const distanceElement = document.getElementById("distance");
  if (distanceElement) {
    distanceElement.textContent = currentDistance;
  }
}

// 确保技能卡牌描述正确
const allSkillCards = [
  new SkillCard(1, "前冲", 2, 2, -2, 2, "向前移动2格(减少距离)并造成2点伤害", "attack"),
  new SkillCard(2, "防守", 0, 0, 0, 1, "抵挡小于2点的伤害", "support"),
  new SkillCard(3, "劈砍", 3, 2, 0, 2, "造成3点伤害", "attack"),
  new SkillCard(4, "魔法球", 1, 10, 0, 1, "远程造成1点伤害", "attack"),
  new SkillCard(5, "后退", 0, 0, 2, 1, "后退2格(增加距离)", "move"),
  new SkillCard(6, "冲锋", 4, 1, -3, 3, "向前冲锋3格(减少距离)并造成4点伤害", "attack"),
  new SkillCard(7, "治疗", -2, 0, 0, 3, "恢复2点生命", "support"),
  new SkillCard(
    8,
    "远程射击",
    2,
    8,
    1,
    2,
    "后退1格(增加距离)并造成2点远程伤害",
    "attack"
  ),
  new SkillCard(9, "魔力恢复", 0, 0, 0, 0, "恢复2点蓝量", "support"),
  new SkillCard(10, "闪避", 0, 0, 3, 2, "快速后退3格(增加距离)", "move"),
  new SkillCard(11, "炸弹", 5, 1, 0, 3, "造成5点伤害", "attack"),
  new SkillCard(12, "冰冻", 0, 0, 0, 4, "冻结对手1回合", "support"),
];

// 修改游戏状态初始化
const gameState = {
  player: new Character(true),
  ai: new Character(false),
  distance: INITIAL_DISTANCE,
  maxDistance: 10, // 设置最大距离为10
  round: 1,
  playerCard: null,
  aiCard: null,
  playerCards: [],
  waitingForSelection: true,
  gameOver: false,
};

// DOM元素
const playerHealthElement = document.getElementById("player-health");
const playerManaElement = document.getElementById("player-mana");
const aiHealthElement = document.getElementById("ai-health");
const aiManaElement = document.getElementById("ai-mana");
const distanceElement = document.getElementById("distance");
const cardContainer = document.getElementById("card-container");
const confirmButton = document.getElementById("confirm-button");
const gameLogElement = document.getElementById("game-log");
const playerHealthBar = document.getElementById("player-health-bar");
const playerManaBar = document.getElementById("player-mana-bar");
const aiHealthBar = document.getElementById("ai-health-bar");
const aiManaBar = document.getElementById("ai-mana-bar");
const effectAnimation = document.getElementById("effect-animation");
const gameOverElement = document.getElementById("game-over");
const gameResultElement = document.getElementById("game-result");
const restartButton = document.getElementById("restart-button");
const roundNumberElement = document.getElementById("round-number");
const helpButton = document.getElementById("help-button");
const helpModal = document.getElementById("help-modal");
const closeButton = document.querySelector(".close-button");

// 日志函数
function logMessage(message) {
  const logEntry = document.createElement("div");
  logEntry.textContent = `[回合${gameState.round}] ${message}`;
  gameLogElement.appendChild(logEntry);
  gameLogElement.scrollTop = gameLogElement.scrollHeight;
}

// 更新界面显示
function updateUI() {
  playerHealthElement.textContent = gameState.player.health;
  playerManaElement.textContent = gameState.player.mana;
  aiHealthElement.textContent = gameState.ai.health;
  aiManaElement.textContent = gameState.ai.mana;
  distanceElement.textContent = gameState.distance;
  roundNumberElement.textContent = gameState.round;

  playerHealthBar.style.width = `${
    (gameState.player.health / gameState.player.maxHealth) * 100
  }%`;
  playerManaBar.style.width = `${
    (gameState.player.mana / gameState.player.maxMana) * 100
  }%`;
  aiHealthBar.style.width = `${
    (gameState.ai.health / gameState.ai.maxHealth) * 100
  }%`;
  aiManaBar.style.width = `${
    (gameState.ai.mana / gameState.ai.maxMana) * 100
  }%`;
  
  // 更新冻结状态显示
  if (gameState.player.frozen) {
    document.querySelector(".player").style.opacity = "0.5";
  } else {
    document.querySelector(".player").style.opacity = "1";
  }
  
  if (gameState.ai.frozen) {
    document.querySelector(".ai").style.opacity = "0.5";
  } else {
    document.querySelector(".ai").style.opacity = "1";
  }
}

// 从牌组中随机抽取卡牌
function drawRandomCards(count) {
  const availableCards = [...allSkillCards];
  const drawnCards = [];

  for (let i = 0; i < count; i++) {
    if (availableCards.length === 0) break;

    const randomIndex = Math.floor(Math.random() * availableCards.length);
    drawnCards.push(availableCards[randomIndex]);
    availableCards.splice(randomIndex, 1);
  }

  return drawnCards;
}

// 创建卡牌元素 - 优化版本
function createCardElements(cards) {
  // 确保卡牌容器存在
  if (!cardContainer) {
    console.error("Card container not found!");
    return;
  }

  // 清空现有卡牌
  cardContainer.innerHTML = "";

  // 确保有卡牌需要创建
  if (!cards || cards.length === 0) {
    console.error("No cards to display!");
    return;
  }

  // 为每张卡牌创建DOM元素
  cards.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.className = "card";
    cardElement.dataset.cardId = card.id;

    const titleElement = document.createElement("div");
    titleElement.className = "card-title";
    titleElement.textContent = card.name;

    const descriptionElement = document.createElement("div");
    descriptionElement.className = "card-description";
    descriptionElement.textContent = card.description;

    const statsElement = document.createElement("div");
    statsElement.className = "card-stats";
    
    // 根据卡牌类型显示不同的统计信息
    if (card.type === "attack") {
      statsElement.innerHTML = `
        <span>伤害: ${card.damage}</span>
        <span>范围: ${card.range}</span>
        <span>消耗: ${card.manaCost}</span>
      `;
    } else if (card.type === "move") {
      statsElement.innerHTML = `
        <span>移动: ${card.movement > 0 ? "后退" + card.movement : "前进" + Math.abs(card.movement)}</span>
        <span>消耗: ${card.manaCost}</span>
      `;
    } else {
      statsElement.innerHTML = `
        <span>${card.damage < 0 ? "治疗: " + (-card.damage) : ""}</span>
        <span>消耗: ${card.manaCost}</span>
      `;
    }

    // 添加卡牌类型标识
    const typeElement = document.createElement("div");
    typeElement.className = `card-type card-type-${card.type}`;
    typeElement.textContent = card.type === "attack" ? "攻击" : 
                             (card.type === "move" ? "移动" : "辅助");

    // 添加所有元素到卡牌
    cardElement.appendChild(titleElement);
    cardElement.appendChild(descriptionElement);
    cardElement.appendChild(statsElement);
    cardElement.appendChild(typeElement);

    // 添加点击事件
    cardElement.addEventListener("click", () => selectCard(card.id));

    // 将卡牌添加到容器
    cardContainer.appendChild(cardElement);
  });
}

// 选择卡牌
function selectCard(cardId) {
  if (gameState.gameOver) return;

  gameState.playerCard = cardId;

  // 更新选中卡牌的视觉效果
  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    if (card.dataset.cardId == cardId) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

  // 启用确认按钮
  confirmButton.disabled = false;
}

// AI选择卡牌 - 优化AI策略
function aiSelectCard(availableCards) {
  const distance = gameState.distance;
  const aiHealth = gameState.ai.health;
  const playerHealth = gameState.player.health;
  const aiMana = gameState.ai.mana;

  // 如果AI被冻结，随机选择一张卡
  if (gameState.ai.frozen) {
    return availableCards[Math.floor(Math.random() * availableCards.length)].id;
  }

  // 如果AI血量很低，优先选择治疗卡牌
  if (aiHealth <= 3) {
    const healCards = availableCards.filter(card => card.damage < 0);
    if (healCards.length > 0) {
      return healCards[0].id;
    }
  }

    // 如果玩家血量很低，优先选择能造成伤害的卡
    if (playerHealth <= 3) {
      const damageCards = availableCards.filter(
        card => card.damage > 0 && card.range >= distance
      );
      if (damageCards.length > 0) {
        return damageCards.sort((a, b) => b.damage - a.damage)[0].id;
      }
    }
  
    // 如果距离很近，优先选择高伤害技能或后退
    if (distance <= 2) {
      // 有50%的概率选择攻击，50%的概率选择后退
      if (Math.random() < 0.5) {
        const attackCards = availableCards.filter(
          card => card.damage > 0 && card.range >= distance
        );
        if (attackCards.length > 0) {
          return attackCards.sort((a, b) => b.damage - a.damage)[0].id;
        }
      } else {
        const retreatCards = availableCards.filter(card => card.movement > 0);
        if (retreatCards.length > 0) {
          return retreatCards.sort((a, b) => b.movement - a.movement)[0].id;
        }
      }
    }
  
    // 如果距离很远，优先选择前进或远程攻击
    if (distance > 5) {
      // 有60%的概率选择前进，40%的概率选择远程攻击
      if (Math.random() < 0.6) {
        const advanceCards = availableCards.filter(card => card.movement < 0);
        if (advanceCards.length > 0) {
          return advanceCards.sort((a, b) => a.movement - b.movement)[0].id;
        }
      } else {
        const rangeCards = availableCards.filter(
          card => card.damage > 0 && card.range >= distance
        );
        if (rangeCards.length > 0) {
          return rangeCards[0].id;
        }
      }
    }
  
    // 如果蓝量低，优先选择恢复蓝量的卡牌
    if (aiMana <= 2) {
      const manaCards = availableCards.filter(card => card.manaCost === 0);
      if (manaCards.length > 0) {
        return manaCards[0].id;
      }
    }
  
    // 如果玩家血量高于AI，考虑使用冰冻
    if (playerHealth > aiHealth && aiMana >= 4) {
      const freezeCards = availableCards.filter(card => card.name === "冰冻");
      if (freezeCards.length > 0) {
        return freezeCards[0].id;
      }
    }
  
    // 随机选择一张卡牌
    return availableCards[Math.floor(Math.random() * availableCards.length)].id;
  }
  
  // 显示技能释放效果
  function showSkillEffect(isPlayer, skillName) {
    effectAnimation.innerHTML = "";
  
    const effect = document.createElement("div");
    effect.style.position = "absolute";
    effect.style.textAlign = "center";
    effect.style.fontSize = "24px";
    effect.style.fontWeight = "bold";
    effect.style.color = "white";
    effect.style.textShadow = "0 0 10px black";
  
    if (isPlayer) {
      effect.style.left = "30%";
      effect.style.top = "50%";
      effect.style.animation = "moveRight 1s forwards";
    } else {
      effect.style.right = "30%";
      effect.style.top = "50%";
      effect.style.animation = "moveLeft 1s forwards";
    }
  
    effect.textContent = skillName + "!";
  
    effectAnimation.appendChild(effect);
  
    // 添加一个样式来创建动画
    const style = document.createElement("style");
    style.textContent = `
      @keyframes moveRight {
        0% { transform: translateX(0) scale(1); opacity: 1; }
        100% { transform: translateX(100px) scale(1.5); opacity: 0; }
      }
      @keyframes moveLeft {
        0% { transform: translateX(0) scale(1); opacity: 1; }
        100% { transform: translateX(-100px) scale(1.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  
    // 一段时间后移除效果
    setTimeout(() => {
      effectAnimation.innerHTML = "";
      document.head.removeChild(style);
    }, 1000);
  }
  
  // 执行回合时更新角色位置
  function executeRound() {
    gameState.waitingForSelection = false;
  
    const playerSelectedCard = allSkillCards.find(
      (card) => card.id == gameState.playerCard
    );
    const aiSelectedCard = allSkillCards.find(
      (card) => card.id == gameState.aiCard
    );
  
    logMessage(`回合${gameState.round}开始`);
    logMessage(
      `玩家选择了【${playerSelectedCard.name}】，AI选择了【${aiSelectedCard.name}】`
    );
  
    // 添加卡牌使用动画效果
    const playerCardElement = document.querySelector(`.card[data-card-id="${gameState.playerCard}"]`);
    if (playerCardElement) {
      playerCardElement.classList.add("card-used");
      setTimeout(() => {
        playerCardElement.classList.remove("card-used");
      }, 500);
    }
  
    showSkillEffect(true, playerSelectedCard.name);
  
    const aiDefeated = playerSelectedCard.use(
      gameState.player,
      gameState.ai,
      gameState
    );
  
    updateUI();
  
    if (aiDefeated) {
      endGame(true);
      return;
    }
  
    setTimeout(() => {
      showSkillEffect(false, aiSelectedCard.name);
  
      const playerDefeated = aiSelectedCard.use(
        gameState.ai,
        gameState.player,
        gameState
      );
  
      updateUI();
  
      if (playerDefeated) {
        endGame(false);
        return;
      }
  
      startNextRound();
    }, 1500);
  }
  
  // 开始下一回合 - 优化版本
  function startNextRound() {
    gameState.round++;
    gameState.waitingForSelection = true;
    gameState.playerCard = null;
    gameState.aiCard = null;
  
    // 回合开始时恢复一些蓝量
    gameState.player.restoreMana(1);
    gameState.ai.restoreMana(1);
  
    logMessage(`回合${gameState.round}开始，双方恢复1点蓝量`);
  
    // 抽取新的卡牌
    gameState.playerCards = drawRandomCards(CARDS_PER_ROUND);
  
    // 确保抽到了卡牌
    if (gameState.playerCards.length === 0) {
      console.error("Failed to draw cards!");
      gameState.playerCards = [...allSkillCards].slice(0, CARDS_PER_ROUND);
    }
  
    // 创建卡牌元素
    createCardElements(gameState.playerCards);
  
    // 重置确认按钮
    confirmButton.disabled = true;
  
    // 更新UI
    updateUI();
  }
  
  // 结束游戏
  function endGame(playerWon) {
    gameState.gameOver = true;
  
    gameResultElement.textContent = playerWon ? "你赢了!" : "你输了!";
    gameOverElement.style.display = "flex";
  
    // 添加胜利/失败动画效果
    const resultAnimation = document.createElement("div");
    resultAnimation.className = "result-animation";
    resultAnimation.textContent = playerWon ? "胜利!" : "失败!";
    resultAnimation.style.color = playerWon ? "gold" : "red";
    gameOverElement.insertBefore(resultAnimation, gameResultElement);
  
    logMessage(playerWon ? "游戏结束，玩家获胜!" : "游戏结束，AI获胜!");
  }
  
  // 确保重新开始游戏时也重置角色位置
  function restartGame() {
    // 移除可能存在的结果动画
    const resultAnimation = document.querySelector(".result-animation");
    if (resultAnimation) {
      resultAnimation.remove();
    }
  
    // 重置游戏状态
    gameState.player = new Character(true);
    gameState.ai = new Character(false);
    gameState.distance = INITIAL_DISTANCE;
    gameState.round = 1;
    gameState.playerCard = null;
    gameState.aiCard = null;
    gameState.waitingForSelection = true;
    gameState.gameOver = false;
  
    // 清空日志
    gameLogElement.innerHTML = "";
  
    // 隐藏游戏结束界面
    gameOverElement.style.display = "none";
  
    // 抽取新的卡牌
    gameState.playerCards = drawRandomCards(CARDS_PER_ROUND);
    createCardElements(gameState.playerCards);
  
    // 重置确认按钮
    confirmButton.disabled = true;
  
    // 更新UI
    updateUI();
    updateCharacterPositions(gameState);
  
    logMessage("新的游戏开始了!");
  }
  
  // 显示帮助模态框
  function showHelpModal() {
    helpModal.style.display = "block";
  }
  
  // 关闭帮助模态框
  function closeHelpModal() {
    helpModal.style.display = "none";
  }
  
  // 确认按钮点击事件
  confirmButton.addEventListener("click", () => {
    if (!gameState.playerCard || !gameState.waitingForSelection) return;
  
    // AI选择卡牌
    gameState.aiCard = aiSelectCard(drawRandomCards(CARDS_PER_ROUND));
  
    // 执行回合
    executeRound();
  });
  
  // 重新开始按钮点击事件
  restartButton.addEventListener("click", restartGame);
  
  // 帮助按钮点击事件
  helpButton.addEventListener("click", showHelpModal);
  
  // 关闭按钮点击事件
  closeButton.addEventListener("click", closeHelpModal);
  
  // 点击模态框外部关闭
  window.addEventListener("click", (event) => {
    if (event.target === helpModal) {
      closeHelpModal();
    }
  });
  
  // 键盘快捷键
  document.addEventListener("keydown", (event) => {
    // ESC键关闭帮助模态框
    if (event.key === "Escape") {
      closeHelpModal();
    }
    
    // 数字键1-3快速选择卡牌
    if (gameState.waitingForSelection && !gameState.gameOver) {
      if (event.key >= "1" && event.key <= "3") {
        const cardIndex = parseInt(event.key) - 1;
        if (gameState.playerCards[cardIndex]) {
          selectCard(gameState.playerCards[cardIndex].id);
        }
      }
      
      // 回车键确认选择
      if (event.key === "Enter" && !confirmButton.disabled) {
        confirmButton.click();
      }
    }
    
    // R键重新开始游戏
    if (event.key === "r" && gameState.gameOver) {
      restartGame();
    }
  });
  
  // 修改初始化函数，添加角色定位
  function initGame() {
    console.log("Initializing game...");
  
    if (!cardContainer) {
      console.error("Card container not found during initialization!");
      return;
    }
  
    // 初始化UI
    updateUI();
  
    // 设置角色初始位置样式
    const player = document.querySelector(".player");
    const ai = document.querySelector(".ai");
    if (player && ai) {
      player.style.position = "absolute";
      ai.style.position = "absolute";
    }
  
    // 初始设置角色位置
    updateCharacterPositions(gameState);
  
    if (!allSkillCards || allSkillCards.length === 0) {
      console.error("No skill cards defined!");
      return;
    }
  
    console.log("Starting first round...");
  
    gameState.playerCards = drawRandomCards(CARDS_PER_ROUND);
    console.log("Initial cards:", gameState.playerCards);
    createCardElements(gameState.playerCards);
  
    logMessage("游戏开始!");
  }
  
  // 确保页面加载完成后再初始化游戏
  document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded");
    initGame();
  });
  
  // 添加立即执行的初始化
  (function () {
    console.log("Immediate initialization check");
    // 如果文档已经加载完成，立即初始化
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      console.log("Document already ready, initializing game immediately");
      setTimeout(initGame, 100); // 稍微延迟以确保所有DOM元素都已加载
    }
  })();
  
  // 添加窗口大小变化时重新计算角色位置
  window.addEventListener("resize", () => {
    updateCharacterPositions(gameState);
  });