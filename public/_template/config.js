/* ============================================================
   SABLE — agent config
   This is the ONLY file you edit to run an agent's card.
   ============================================================ */
window.SABLE = {

  // --- who ---------------------------------------------------
  slug:      "jessicahamley",          // must match the folder name
  firstName: "Jessica",                // used in the activation greeting
  fullName:  "Jessica Hamley",
  phone:     "615-555-0100",           // her number, for buyer CTAs
  brokerage: "The Homestead Group",

  // --- mode --------------------------------------------------
  // "openhouse" -> the card opens the listing named below
  // "landing"   -> the card opens landingUrl (blog-card tier)
  mode: "openhouse",

  // --- open house mode --------------------------------------
  // folder name of the listing to open, e.g. "4524-skywood"
  listing: "4524-skywood",

  // --- landing mode -----------------------------------------
  landingUrl: "",                      // her blog or site

  // --- leads -------------------------------------------------
  // Her own Apps Script web-app URL. Each agent gets their own
  // sheet + deployment, so no agent ever sees another's leads.
  leadsUrl: ""
};
