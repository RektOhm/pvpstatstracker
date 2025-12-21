function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function decodeBase64Url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

function renderBlock(id, title, html) {
  const el = document.getElementById(id);
  el.innerHTML = `<h2>${title}</h2>${html}`;
}

const dataParam = getParam("data");

if (!dataParam) {
  document.getElementById("meta").innerHTML =
    "No data provided. Paste a PvPStatsTracker link.";
} else {
  try {
    const json = JSON.parse(decodeBase64Url(dataParam));

    const days = Math.floor((Date.now() / 1000 - json.resetDate) / 86400);

    document.getElementById("meta").innerHTML = `
      <b>Character:</b> ${json.character.name}<br>
      <b>Realm:</b> ${json.character.realm}<br>
      <b>Faction:</b> ${json.character.faction}<br>
      <b>Stats since:</b> ${days} days
    `;

    renderBlock("global", "Global", `
      <p><b>Wins:</b> ${json.global.wins} |
         <b>Losses:</b> ${json.global.losses}</p>
      <p><b>Winrate:</b>
         ${((json.global.wins + json.global.losses) === 0
            ? 0
            : (json.global.wins / (json.global.wins + json.global.losses)) * 100
         ).toFixed(1)}%</p>
      <p><b>Lifetime HKs:</b> ${json.global.honorableKills}</p>
      <p><b>Current streak:</b> ${json.global.winStreak} |
         <b>Best streak:</b> ${json.global.bestWinStreak}</p>
    `);

    function renderBG(id, title, bg) {
      renderBlock(id, title, `
        <p><b>Played:</b> ${bg.played}</p>
        <p><b>Wins:</b> ${bg.wins} |
           <b>Losses:</b> ${bg.losses}</p>
        <p><b>Winrate:</b>
           ${((bg.wins + bg.losses) === 0
              ? 0
              : (bg.wins / (bg.wins + bg.losses)) * 100
           ).toFixed(1)}%</p>
        ${bg.flagsCaptured !== undefined
          ? `<p><b>Flags:</b> ${bg.flagsCaptured} / ${bg.flagsReturned}</p>`
          : ""}
        <p><b>Leaves:</b> ${bg.leavers}</p>
      `);
    }

    renderBG("wsg", "Warsong Gulch", json.battlegrounds.WSG);
    renderBG("ab", "Arathi Basin", json.battlegrounds.AB);
    renderBG("av", "Alterac Valley", json.battlegrounds.AV);

    document.getElementById("footer").innerText =
      "Generated via PvPStatsTracker";

  } catch (e) {
    document.getElementById("meta").innerHTML =
      "Invalid or corrupted data.";
  }
}
