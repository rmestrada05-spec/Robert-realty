/* ============================================================
   SABLE — agent config
   This is the ONLY file you edit to run an agent's card.
   ============================================================ */
window.SABLE = {

  // --- who ---------------------------------------------------
  slug:      "mireyaestrada",
  firstName: "Mireya",
  fullName:  "Mireya Estrada",
  phone:     "",                       // her cell, as buyers should see it
  brokerage: "",                       // brokerage name — required on CA advertising
  license:   "",                       // CA DRE # — required on CA advertising
  email:     "realtormestrada@gmail.com",

  // --- her brand (from her mood board) -----------------------
  brand: {
    accent:  "#0517FB",                // the one color in her palette
    display: "'Playfair Display', Georgia, serif",
    body:    "'Jost', 'Inter', sans-serif",
    script:  "'Allura', cursive",      // stand-in for Retro Signature (not a web font)
    tagline: "let ME help you",
    portrait:"img/mireya.jpg"
  },

  // --- mode --------------------------------------------------
  // "openhouse" -> the card opens the listing named below
  // "landing"   -> the card opens landingUrl (blog-card tier)
  mode: "openhouse",
  listing: "",                         // her listing folder, once photos land
  landingUrl: "",

  // --- leads -------------------------------------------------
  // Her own Apps Script web-app URL — her own sheet, her own deployment.
  leadsUrl: ""
};
