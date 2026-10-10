/* Local time next to the location ("Debrecen, Hungary · 16:05 CEST"),
   updated every minute. Without JavaScript only the location shows. */
(function () {
  var slots = document.querySelectorAll(".js-local-time");
  if (!slots.length || !window.Intl) return;

  var zone = "Europe/Budapest";
  var clock = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  });

  // CET in winter, CEST in summer, from Budapest's offset to UTC
  function zoneName(now) {
    var parts = clock.formatToParts(now);
    var h = +parts.find(function (p) { return p.type === "hour"; }).value;
    var m = +parts.find(function (p) { return p.type === "minute"; }).value;
    var offset = ((h * 60 + m) - (now.getUTCHours() * 60 + now.getUTCMinutes()) + 1440) % 1440;
    return offset === 120 ? "CEST" : "CET";
  }

  function update() {
    var now = new Date();
    var text = " · " + clock.format(now) + " " + zoneName(now);
    slots.forEach(function (el) { el.textContent = text; });
  }

  update();
  // tick on the minute
  setTimeout(function () { update(); setInterval(update, 60000); }, 60000 - Date.now() % 60000);
})();
