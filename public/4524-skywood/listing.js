/* ============================================================
   SABLE — listing config
   The only file an agent edits to run a listing. Nothing below
   this block is hardcoded into the brochure.
   ============================================================ */
window.LISTING_CFG = {

  // --- the home ----------------------------------------------
  address:   "4524 Skywood Lane",
  area:      "Skyridge, Nashville",
  price:     "$369,900",
  beds:      "3",
  baths:     "2.5",
  sqft:      "1,600",

  // --- the agent ---------------------------------------------
  // Falls back to window.SABLE when the card is served from
  // sable.estate, so a subscriber sets this once, not per listing.
  agent:     "Robert Michael",
  phone:     "661 · 713 · 9667",
  phoneRaw:  "+16617139667",          // tel:/sms: form, digits only
  email:     "team@robertmichaelrealty.com",
  brokerage: "The Homestead Group",
  license:   "",                      // REQUIRED in CA/FL/etc. Printed in the footer.
  licenseSt: "TN",

  /* --- what's on offer ---------------------------------------
     THE RULE, and it is the product: the brochure is never gated.
     Everything on this page is readable by anyone who taps the
     card. These are things you SEND, not things you withhold.

     Write them as offers ("Get the floor plan"), never as
     questions that manufacture a gap ("What's the payment?").
     The question version converts better and costs you the room.

     Delete any offer you can't actually deliver within the hour.
     A dead promise is worse than a plain button.

     The last entry is the direct line. It takes no information
     from the buyer and it cannot be removed — every Sable card
     resolves to a human. The roll ends there and stays there.  */
  offers: [
    { id:"plan",
      label:"Get the floor plan",
      head:"Floor plan.",
      sub:"Tell me where to send it and it's on its way.",
      cta:"Send it over" },

    { id:"numbers",
      label:"Get the numbers",
      head:"The numbers.",
      sub:"Payment estimate, taxes, HOA — what it actually costs to live here.",
      cta:"Send the numbers" },

    { id:"direct",
      label:"Just text {first}",
      sms:true,
      body:"Hi {first}, I'm at {address}." }
  ],

  // Shown under the form, every time. Not fine print.
  consent: "{agent} may text or call you about this home. " +
           "Message and data rates may apply. Reply STOP to opt out."
};
