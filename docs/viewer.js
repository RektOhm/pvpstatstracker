// ===============================
// PvPStatsTracker - Viewer.js
// ===============================

// ---- URL helpers ----
function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// ---- UTF-8 safe Base64 (URL-safe) decoding ----
function decodeBase64UrlUnicode(str) {
  // URL-safe → standard Base64
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";

  // UTF-8 safe decode
  return decodeURIComponent(
    Array.prototype.map.call(atob(str), c =>
      "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
    ).join("")
  );
}

// ---- Rendering helpers ----
function renderBlock(id, title, html) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<h2>${title}</h2>${html}`;
}

function winrate(wins, losses) {
  const total = wins + losses;
  return total === 0 ? "0.0" : ((wins / total) * 100).toFixed(1);
}

// ===============================
// Main
// ===============================
const dataParam = getParam("data");

if (!dataParam) {
  document.getElementById("meta").innerHTML =
    "No data provided. Paste a PvPStatsTracker export link.";
} else {
  try {
    const json = JSON.parse(decodeBase64UrlUnicode(dataParam));

    // ---- Meta / character info ----
    const days =
      json.resetDate
        ? Math.floor((Date.now() / 1000 - json.resetDate) / 86400)
        : 0;

    document.getElementById("meta").innerHTML = `
      <b>Character:</b> ${json.character.name}<br>
      <b>Realm:</b> ${json.character.realm}<br>
      <b>Faction:</b> ${json.character.faction}<br>
      <b>Stats since:</b> ${days} day(s)
    `;

    // ---- Global stats ----
    renderBlock("global", "Global", `
      <p><b>Wins:</b> ${json.global.wins} |
         <b>Losses:</b> ${json.global.losses}</p>
      <p><b>Winrate:</b> ${winrate(json.global.wins, json.global.losses)}%</p>
      <p><b>Lifetime HKs:</b> ${json.global.honorableKills}</p>
      <p><b>Current streak:</b> ${json.global.winStreak} |
         <b>Best streak:</b> ${json.global.bestWinStreak}</p>
    `);

    // ---- Battleground rendering ----
    function renderBG(id, title, bg, isWSG = false) {
      if (!bg) {
        renderBlock(id, title, "<p>No data.</p>");
        return;
      }

      let html = `
        <p><b>Played:</b> ${bg.played}</p>
        <p><b>Wins:</b> ${bg.wins} |
           <b>Losses:</b> ${bg.losses}</p>
        <p><b>Winrate:</b> ${winrate(bg.wins, bg.losses)}%</p>
      `;

      // WSG-only: flags
      if (isWSG) {
        html += `
          <p><b>Flags captured:</b> ${bg.flagsCapturedEnemy || 0}</p>
          <p><b>Flags returned:</b> ${bg.flagsReturnedFriendly || 0}</p>
        `;
      }

      html += `<p><b>Deserters:</b> ${bg.leavers || 0}</p>`;

      renderBlock(id, title, html);
    }

    // ---- BGs ----
    renderBG("wsg", "Warsong Gulch", json.battlegrounds.WSG, true);
    renderBG("ab", "Arathi Basin", json.battlegrounds.AB, false);
    renderBG("av", "Alterac Valley", json.battlegrounds.AV, false);

    // ---- Footer ----
    document.getElementById("footer").innerText =
      "Generated via PvPStatsTracker";

  } catch (e) {
    console.error(e);
    document.getElementById("meta").innerHTML =
      "Invalid or corrupted data.";
  }
}
