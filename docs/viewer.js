// ===============================
// PvPStatsTracker Viewer
// ===============================

// ---- URL helpers ----
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ---- UTF-8 safe Base64 URL decoding ----
function decodeBase64UrlUnicode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";

  return decodeURIComponent(
    Array.prototype.map.call(atob(str), c =>
      "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
    ).join("")
  );
}

// ---- Utils ----
function winrate(w, l) {
  const t = w + l;
  return t === 0 ? "0.0" : ((w / t) * 100).toFixed(1);
}

function renderBlock(id, title, html, extraClass = "") {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `block ${extraClass}`;
  el.innerHTML = `<h2>${title}</h2>${html}`;
}

// ===============================
// MAIN
// ===============================
const dataParam = getParam("data");

if (!dataParam) {
  document.getElementById("meta").innerText =
    "No data provided. Paste a PvPStatsTracker export link.";
} else {
  try {
    const json = JSON.parse(decodeBase64UrlUnicode(dataParam));

    // ---- META ----
    const days = json.resetDate
      ? Math.floor((Date.now() / 1000 - json.resetDate) / 86400)
      : 0;

    const factionClass =
      json.character.faction === "Alliance"
        ? "faction-alliance"
        : "faction-horde";

    const factionIcon =
      json.character.faction === "Alliance" ? "🦁" : "🪓";

    document.querySelector("h1").innerHTML = `${factionIcon} PvP Stats`;

    document.getElementById("meta").innerHTML = `
      <b>Character:</b> <span class="stat">${json.character.name}</span><br>
      <b>Realm:</b> <span class="stat">${json.character.realm}</span><br>
      <b>Faction:</b>
      <span class="${factionClass}">${json.character.faction}</span><br>
      <b>Stats since:</b> <span class="stat">${days} day(s)</span>
    `;

    // ---- RENDERING ----
    function render(mode) {
      const g = json.global[mode];
      const bgs = json.battlegrounds[mode];

      renderBlock(
        "global",
        "Global",
        `
        <p>
          <span class="label">Wins:</span>
          <span class="stat win">${g.wins}</span> |
          <span class="label">Losses:</span>
          <span class="stat loss">${g.losses}</span>
        </p>
        <p>
          <span class="label">Winrate:</span>
          <span class="stat">${winrate(g.wins, g.losses)}%</span>
        </p>
        <p>
          <span class="label">Lifetime HKs:</span>
          <span class="stat">${json.global.overall.honorableKills}</span>
        </p>
        <p>
          <span class="label">Current streak:</span>
          <span class="stat">${json.global.overall.winStreak}</span> |
          <span class="label">Best streak:</span>
          <span class="stat">${json.global.overall.bestWinStreak}</span>
        </p>
      `,
        "global"
      );

      renderBG("wsg", "Warsong Gulch", bgs.WSG, true);
      renderBG("ab", "Arathi Basin", bgs.AB);
      renderBG("av", "Alterac Valley", bgs.AV);
    }

    function renderBG(id, title, bg, isWSG = false) {
      if (!bg) {
        renderBlock(id, title, "<p>No data.</p>", id);
        return;
      }

      let html = `
        <p>
          <span class="label">Played:</span>
          <span class="stat">${bg.played}</span>
        </p>
        <p>
          <span class="label">Wins:</span>
          <span class="stat win">${bg.wins}</span> |
          <span class="label">Losses:</span>
          <span class="stat loss">${bg.losses}</span>
        </p>
        <p>
          <span class="label">Winrate:</span>
          <span class="stat">${winrate(bg.wins, bg.losses)}%</span>
        </p>
      `;

      if (isWSG) {
        html += `
          <p>
            <span class="label">Flags captured:</span>
            <span class="stat">${bg.flagsCapturedEnemy || 0}</span>
          </p>
          <p>
            <span class="label">Flags returned:</span>
            <span class="stat">${bg.flagsReturnedFriendly || 0}</span>
          </p>
        `;
      }

      html += `
        <p>
          <span class="label">Deserters:</span>
          <span class="stat">${bg.leavers || 0}</span>
        </p>
      `;

      renderBlock(id, title, html, id);
    }

    // ---- TABS ----
    document.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(b =>
          b.classList.remove("active")
        );
        btn.classList.add("active");
        render(btn.dataset.mode);
      });
    });

    // Initial render
    render("overall");

    document.getElementById("footer").innerText =
      "Generated via PvPStatsTracker";

  } catch (e) {
    console.error(e);
    document.getElementById("meta").innerText =
      "Invalid or corrupted data.";
  }
}
