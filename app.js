document.addEventListener("DOMContentLoaded", () => {

  function updateLabel(slot, value) {
    const label = document.querySelector(`[data-player-label="${slot}"]`);
    if (!label) return;
    label.textContent = value && value.trim() ? value.trim() : String(slot);
  }

  const formations = {
    "22": ["pos-gk", "pos-2", "pos-3", "pos-4", "pos-5"],
    "121": ["pos-gk", "pos-121-df", "pos-121-mf1", "pos-121-mf2", "pos-121-fw"],
    "31": ["pos-gk", "pos-31-df1", "pos-31-df2", "pos-31-df3", "pos-31-fw"]
  };

  function clearDraggedPosition(player) {
    player.style.left = "";
    player.style.top = "";
    player.style.transform = "";
  }

  function applyFormation(type) {
    const players = document.querySelectorAll("[data-player-label]");
    if (!formations[type]) return;

    players.forEach((p, i) => {
      clearDraggedPosition(p);
      p.className = `p ${formations[type][i]}`;
    });
  }

  function resetFormationOnly() {
    const selected = document.querySelector('input[name="formation"]:checked')?.value || "22";
    applyFormation(selected);
  }

  function savePlayers() {
    const players = {};

    document.querySelectorAll("[data-player-input]").forEach((input) => {
      const slot = input.getAttribute("data-player-input");
      players[slot] = input.value;
    });

    localStorage.setItem("tact_players", JSON.stringify(players));
  }

  function saveFormation(type) {
    localStorage.setItem("tact_formation", type);
  }

  function loadSavedData() {
    const savedPlayers = localStorage.getItem("tact_players");

    if (savedPlayers) {
      const players = JSON.parse(savedPlayers);

      Object.keys(players).forEach((slot) => {
        const input = document.querySelector(`[data-player-input="${slot}"]`);

        if (input) {
          input.value = players[slot];
          updateLabel(slot, players[slot]);
        }
      });
    }

    const savedFormation = localStorage.getItem("tact_formation");

    if (savedFormation) {
      const radio = document.querySelector(`input[name="formation"][value="${savedFormation}"]`);

      if (radio) {
        radio.checked = true;
        applyFormation(savedFormation);
      }
    } else {
      applyFormation("22");
    }
  }

  document.querySelectorAll("[data-player-input]").forEach((el) => {
    el.addEventListener("input", (e) => {
      const slot = e.target.getAttribute("data-player-input");
      updateLabel(slot, e.target.value);
      savePlayers();
    });
  });

  document.querySelectorAll('input[name="formation"]').forEach((el) => {
    el.addEventListener("change", () => {
      const selected = document.querySelector('input[name="formation"]:checked')?.value;
      applyFormation(selected);
      saveFormation(selected);
    });
  });

  document.getElementById("formation-reset-btn").addEventListener("click", () => {
    if (confirm("陣形を初期位置に戻しますか？")) {
      resetFormationOnly();
    }
  });

  document.getElementById("export-btn").addEventListener("click", async () => {
    const target = document.getElementById("capture-area");
    if (!target) return;

    try {
      const canvas = await html2canvas(target, {
        backgroundColor: null,
        useCORS: true,
        scale: 2
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "tact-formation.png";
      link.click();
    } catch (error) {
      console.error("画像出力に失敗しました:", error);
      alert("画像出力に失敗しました。");
    }
  });

  loadSavedData();

  const court = document.getElementById("capture-area");
  setupDragAndDrop(court);
});

function resetPlayers() {

  // 入力欄リセット
  document.querySelectorAll("[data-player-input]").forEach((input) => {
    input.value = "";
  });

  // 表示リセット
  document.querySelectorAll("[data-player-label]").forEach((label, index) => {
    const slot = index + 1;

    if (slot === 1) {
      label.textContent = "1";
    } else {
      label.textContent = slot;
    }

    label.style.left = "";
    label.style.top = "";
    label.style.transform = "";
  });

  // localStorage削除
  localStorage.removeItem("tact_players");
}

document.getElementById("reset-btn").addEventListener("click", () => {

  if(confirm("メンバーをリセットしますか？")) {
    resetPlayers();
  }
});

function setupDragAndDrop(court) {
  const players = document.querySelectorAll("[data-player-label]");

  let activePlayer = null;
  let offsetX = 0;
  let offsetY = 0;

  players.forEach((player) => {
    player.addEventListener("pointerdown", (e) => {
      activePlayer = player;
      activePlayer.classList.add("dragging");

      const playerRect = activePlayer.getBoundingClientRect();

      offsetX = e.clientX - playerRect.left;
      offsetY = e.clientY - playerRect.top;

      activePlayer.setPointerCapture(e.pointerId);
    });

    player.addEventListener("pointermove", (e) => {
      if (!activePlayer) return;
    
      const courtRect = court.getBoundingClientRect();
    
      let x = e.clientX - courtRect.left;
      let y = e.clientY - courtRect.top;
    
      const halfWidth = activePlayer.offsetWidth / 2;
      const halfHeight = activePlayer.offsetHeight / 2;
    
      const minX = halfWidth;
      const maxX = court.clientWidth - halfWidth;
      const minY = halfHeight;
      const maxY = court.clientHeight - halfHeight;
    
      x = Math.max(minX, Math.min(x, maxX));
      y = Math.max(minY, Math.min(y, maxY));
    
      activePlayer.style.left = `${x}px`;
      activePlayer.style.top = `${y}px`;
    });

    player.addEventListener("pointerup", () => {
      if(!activePlayer) return;
      activePlayer.classList.remove("dragging");
      activePlayer = null;
    });

    player.addEventListener("pointercancel", () => {
      if(!activePlayer) return;
      activePlayer.classList.remove("dragging");
      activePlayer = null;
    });
  });
}