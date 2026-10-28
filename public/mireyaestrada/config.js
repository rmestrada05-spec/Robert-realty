/* ============================================================
   SABLE — agent config
   This is the ONLY file you edit to run an agent's card.
   ============================================================ */
window.SABLE = {

  // --- who ---------------------------------------------------
  slug:      "mireyaestrada",         // must match the folder name
  firstName: "Mireya",                // used in the activation greeting
  fullName:  "Mireya Estrada",
  phone:     "",                       // her number, for buyer CTAs
  brokerage: "",                       // her brokerage, for the page footer

  // --- mode --------------------------------------------------
  // "openhouse" -> the card opens the listing named below
  // "landing"   -> the card opens landingUrl (blog-card tier)
  mode: "openhouse",

  // --- open house mode --------------------------------------
  // folder name of the listing to open, e.g. "4524-skywood"
  listing: "",                         // her listing folder, once photos land

  // --- landing mode -----------------------------------------
  landingUrl: "",                      // her blog or site

  // --- leads -------------------------------------------------
  // Her own Apps Script web-app URL. Each agent gets their own
  // sheet + deployment, so no agent ever sees another's leads.
  leadsUrl: ""
};
