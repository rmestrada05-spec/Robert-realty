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
     resolves to a human. The roll ends there and stays there.

     An offer is only worth a phone number if it CANNOT be had by standing
     in the room. A floor plan can be screenshotted. A price is on the wall.
     Asking for a number to hand back something already on the page is why
     sign-in sheets sit empty.

     Everything worth a number happens AFTER they leave. That is the whole
     category, and it is the job: what this house does next, and what else
     there is. Bound every one of them — people don't withhold a number
     because they don't want the thing, they withhold it because they're
     afraid of the campaign. Say where it ends and they'll give it.

     Keep labels under ~22 characters. The bar auto-fits past that by
     dropping the square footage, but a label that forces it every
     rotation makes the stats flicker.

     Never offer something they're already doing. "See it privately" fails
     this: they are standing in it. The offer has to be about after.

     Slot one is always the plain one. A label that rotates on its own
     starts reading as a banner, and people don't press banners — so the
     first thing it says is what it is.                                    */
  offers: [
    { id:"text",
      label:"Tap to text",
      sms:true,
      body:"Hi {first}, I'm at {address} — " },

    { id:"like",
      label:"Show me three like it",
      head:"Three like it.",
      sub:"Three homes near this one, around this price, sent once. Not a drip campaign.",
      cta:"Send the three" },

    { id:"qualify",
      label:"Text me if I qualify",
      head:"Find out what you qualify for.",
      sub:"I'll put you in front of the lender I work with. They'll text you a real " +
          "number instead of a guess — usually same day.",
      cta:"Connect me" }
  ],

  // One line of flex, shown above the form. Every other card in the
  // business makes you sign in to see the house. This one didn't.
  note: "Nothing on this page was locked.",

  // Shown under the form, every time. Not fine print.
  consent: "{agent} may text or call you about this home. " +
           "Message and data rates may apply. Reply STOP to opt out."
};
