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

function renderBlock(id, title, html) {
  const el = document.getElementById(id);
  if (!el) return;
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

    // ---- Meta ----
    const days = json.resetDate
      ? Math.floor((Date.now() / 1000 - json.resetDate) / 86400)
      : 0;

    document.getElementById("meta").innerHTML = `
      <b>Character:</b> ${json.character.name}<br>
      <b>Realm:</b> ${json.character.realm}<br>
      <b>Faction:</b> ${json.character.faction}<br>
      <b>Stats since:</b> ${days} day(s)
    `;

    // ---- Rendering ----
    function render(mode) {
      const g = json.global[mode];
      const bgs = json.battlegrounds[mode];

      renderBlock("global", "Global", `
        <p><b>Wins:</b> ${g.wins} | <b>Losses:</b> ${g.losses}</p>
        <p><b>Winrate:</b> ${winrate(g.wins, g.losses)}%</p>
        <p><b>Lifetime HKs:</b> ${json.global.overall.honorableKills}</p>
        <p><b>Current streak:</b> ${json.global.overall.winStreak} |
           <b>Best streak:</b> ${json.global.overall.bestWinStreak}</p>
      `);

      renderBG("wsg", "Warsong Gulch", bgs.WSG, true);
      renderBG("ab", "Arathi Basin", bgs.AB);
      renderBG("av", "Alterac Valley", bgs.AV);
    }

    function renderBG(id, title, bg, isWSG = false) {
      if (!bg) {
        renderBlock(id, title, "<p>No data.</p>");
        return;
      }

      let html = `
        <p><b>Played:</b> ${bg.played}</p>
        <p><b>Wins:</b> ${bg.wins} | <b>Losses:</b> ${bg.losses}</p>
        <p><b>Winrate:</b> ${winrate(bg.wins, bg.losses)}%</p>
      `;

      if (isWSG) {
        html += `
          <p><b>Flags captured:</b> ${bg.flagsCapturedEnemy || 0}</p>
          <p><b>Flags returned:</b> ${bg.flagsReturnedFriendly || 0}</p>
        `;
      }

      html += `<p><b>Deserters:</b> ${bg.leavers || 0}</p>`;

      renderBlock(id, title, html);
    }

    // ---- Tabs ----
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
