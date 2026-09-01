document.addEventListener("DOMContentLoaded", function () {

  /* =========================
     Build linked images from data-image
     ========================= */
  document.querySelectorAll(".fpost-imgl, .fpost-imgr, .fpost-image").forEach(function(box) {
    if (box.querySelector("img")) return;

    const url = box.getAttribute("data-image");
    if (!url || !url.trim()) return;

    const link = document.createElement("a");
    link.href = url.trim();
    link.target = "_blank";
    link.rel = "noopener";

    const img = document.createElement("img");
    img.src = url.trim();
    img.alt = "";

    link.appendChild(img);
    box.appendChild(link);
  });


  /* =========================
     Shared popup controls
     ========================= */

  function closePostControlPopups(exceptButton) {
    const exceptId = exceptButton
      ? exceptButton.getAttribute("aria-controls")
      : null;

    document.querySelectorAll("[data-post-control-btn]").forEach(function(btn) {
      if (btn !== exceptButton) {
        btn.setAttribute("aria-expanded", "false");
      }
    });

    document.querySelectorAll("[data-post-control-pop]").forEach(function(pop) {
      if (!exceptId || pop.id !== exceptId) {
        pop.hidden = true;
      }
    });
  }


  function buildInfoToggle(rawValue, idSeed, options) {
    const toggle = document.createElement("div");
    const btn = document.createElement("button");
    const pop = document.createElement("div");

    toggle.className =
      "post-control-toggle " + options.toggleClass;

    btn.className =
      "post-control-btn " + options.buttonClass;

    pop.className =
      "post-control-pop " + options.popupClass;

    pop.id =
      options.popupPrefix + "-" + idSeed;

    btn.type = "button";

    btn.setAttribute(
      "aria-expanded",
      "false"
    );

    btn.setAttribute(
      "aria-label",
      options.ariaLabel
    );

    btn.setAttribute(
      "aria-controls",
      pop.id
    );

    btn.setAttribute(
      "data-post-control-btn",
      ""
    );

    pop.setAttribute(
      "data-post-control-pop",
      ""
    );

    btn.innerHTML =
      `<i class="ph-duotone ${options.icon}"></i>`;

    pop.hidden = true;

    const label = document.createElement("div");
    label.className = "post-control-pop__label";
    label.textContent = options.popupLabel;

    const value = document.createElement("div");
    value.className = "post-control-pop__value";
    value.innerHTML = rawValue;

    pop.appendChild(label);
    pop.appendChild(value);

    btn.addEventListener("click", function(e) {
      e.stopPropagation();

      const isOpen =
        btn.getAttribute("aria-expanded") === "true";

      closePostControlPopups(btn);

      if (isOpen) {
        btn.setAttribute("aria-expanded", "false");
        pop.hidden = true;
      } else {
        btn.setAttribute("aria-expanded", "true");
        pop.hidden = false;
      }
    });

    toggle.appendChild(btn);
    toggle.appendChild(pop);

    return toggle;
  }


  function buildLocationToggle(rawValue, idSeed) {
    return buildInfoToggle(
      rawValue,
      idSeed,
      {
        toggleClass: "meta-toggle",
        buttonClass: "meta-btn",
        popupClass: "meta-pop",
        popupPrefix: "meta-pop",
        icon: "ph-map-pin",
        ariaLabel: "View location",
        popupLabel: "Location"
      }
    );
  }


  function buildPersonsToggle(rawValue, idSeed) {
    return buildInfoToggle(
      rawValue,
      idSeed,
      {
        toggleClass: "npc-toggle",
        buttonClass: "npc-btn",
        popupClass: "npc-pop",
        popupPrefix: "npc-pop",
        icon: "ph-users-three",
        ariaLabel: "View additional persons present",
        popupLabel: "Additional Persons Present"
      }
    );
  }


  function buildNotesToggle(rawValue, idSeed) {
    return buildInfoToggle(
      rawValue,
      idSeed,
      {
        toggleClass: "notes-toggle",
        buttonClass: "notes-btn",
        popupClass: "notes-pop",
        popupPrefix: "notes-pop",
        icon: "ph-note",
        ariaLabel: "View notes",
        popupLabel: "Notes"
      }
    );
  }


  function cleanupBodyLeadingSpace(body) {
    while (
      body.firstChild &&
      (
        (
          body.firstChild.nodeType === 3 &&
          !body.firstChild.textContent.trim()
        ) ||
        (
          body.firstChild.nodeType === 1 &&
          body.firstChild.tagName === "BR"
        )
      )
    ) {
      body.removeChild(body.firstChild);
    }
  }


  /* =========================
     Process plugin blocks
     ========================= */

  function moveNonPopupPlugin(topbar, body, selector) {
    const plugin = body.querySelector(selector);

    if (plugin) {
      topbar.appendChild(plugin);
      return true;
    }

    return false;
  }


  function processFancyPost(post, index) {
    const image = post.querySelector(":scope > .fpost-image");
    const body = post.querySelector(":scope > .fpost-body");

    if (!image || !body) return;

    let overlay = image.querySelector(".fpost-overlay");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "fpost-overlay";
      image.appendChild(overlay);
    }

    let topbar = post.querySelector(":scope > .fpost-topbar");

    if (!topbar) {
      topbar = document.createElement("div");
      topbar.className = "fpost-topbar";
      body.parentNode.insertBefore(topbar, body);
    }

    /*
       IMPORTANT:
       BBCode conversion may insert plugin blocks after DOMContentLoaded,
       or inside wrapper elements. Therefore all plugin searches use
       body.querySelector(), not body.children, and this function is also
       called by the MutationObserver below.
    */

    const meta = body.querySelector(".post-meta");
    const npcs = body.querySelector(".post-npcs");
    const qTop = body.querySelector(".fpost-qtop");
    const notes = body.querySelector(".post-notes");

    /* Quote belongs in the image overlay, not the topbar. */
    if (qTop && !overlay.contains(qTop)) {
      overlay.appendChild(qTop);
    }

    /* LOCATION */
    if (meta) {
      const rawMeta = meta.innerHTML.trim();

      if (rawMeta) {
        topbar.appendChild(
          buildLocationToggle(
            rawMeta,
            "fpost-" + index
          )
        );
      }

      meta.remove();
    }

    /* ADDITIONAL PERSONS PRESENT */
    if (npcs) {
      const rawNPCs = npcs.innerHTML.trim();

      if (rawNPCs) {
        topbar.appendChild(
          buildPersonsToggle(
            rawNPCs,
            "fpost-" + index
          )
        );
      }

      npcs.remove();
    }

    /* NON-POPUP LINK CONTROLS */
    moveNonPopupPlugin(topbar, body, ".fpost-music");
    moveNonPopupPlugin(topbar, body, ".fpost-outfit");
    moveNonPopupPlugin(topbar, body, ".fpost-gear");
    moveNonPopupPlugin(topbar, body, ".fpost-transpo");

    /* NOTES POPUP — deliberately appended last so the seven-control order is:
       meta, npcs, music, outfit, gear, transpo, notes */
    const notesAfterLinks = body.querySelector(".post-notes");

    if (notesAfterLinks) {
      const rawNotes = notesAfterLinks.innerHTML.trim();

      if (rawNotes) {
        topbar.appendChild(
          buildNotesToggle(
            rawNotes,
            "fpost-" + index
          )
        );
      }

      notesAfterLinks.remove();
    }

    if (!overlay.children.length) {
      overlay.remove();
      post.classList.remove("has-fpost-overlay");
    } else {
      post.classList.add("has-fpost-overlay");
    }

    if (!topbar.children.length) {
      topbar.remove();
      post.classList.remove("has-fpost-topbar");
    } else {
      post.classList.add("has-fpost-topbar");
    }

    cleanupBodyLeadingSpace(body);
  }


  function processHeaderlessPost(post, index) {
    const body = post.querySelector(":scope > .post-body");

    if (!body) return;

    let topbar = post.querySelector(":scope > .post-topbar");

    if (!topbar) {
      topbar = document.createElement("div");
      topbar.className = "post-topbar";
      body.parentNode.insertBefore(topbar, body);
    }

    const meta = body.querySelector(".post-meta");
    const npcs = body.querySelector(".post-npcs");

    /* LOCATION */
    if (meta) {
      const rawMeta = meta.innerHTML.trim();

      if (rawMeta) {
        topbar.appendChild(
          buildLocationToggle(
            rawMeta,
            "post-" + index
          )
        );
      }

      meta.remove();
    }

    /* ADDITIONAL PERSONS PRESENT */
    if (npcs) {
      const rawNPCs = npcs.innerHTML.trim();

      if (rawNPCs) {
        topbar.appendChild(
          buildPersonsToggle(
            rawNPCs,
            "post-" + index
          )
        );
      }

      npcs.remove();
    }

    /* NON-POPUP LINK CONTROLS */
    moveNonPopupPlugin(topbar, body, ".fpost-music");
    moveNonPopupPlugin(topbar, body, ".fpost-outfit");
    moveNonPopupPlugin(topbar, body, ".fpost-gear");
    moveNonPopupPlugin(topbar, body, ".fpost-transpo");

    /* NOTES POPUP — last control */
    const notes = body.querySelector(".post-notes");

    if (notes) {
      const rawNotes = notes.innerHTML.trim();

      if (rawNotes) {
        topbar.appendChild(
          buildNotesToggle(
            rawNotes,
            "post-" + index
          )
        );
      }

      notes.remove();
    }

    if (!topbar.children.length) {
      topbar.remove();
    }

    cleanupBodyLeadingSpace(body);
  }


  /* =========================
     Initial processing
     ========================= */

  document.querySelectorAll(".fpost-wrap").forEach(function(post, index) {
    processFancyPost(post, index);
  });

  document.querySelectorAll(".post-wrap").forEach(function(post, index) {
    /* Avoid treating a fancy post as a headerless post if selectors overlap. */
    if (!post.classList.contains("fpost-wrap")) {
      processHeaderlessPost(post, index);
    }
  });


  /* =========================
     Late BBCode/plugin insertion
     ========================= */

  /*
     Some forum/plugin parsers populate [gear], [transpo], and [notes]
     after the initial DOM pass. Watch each post body so those elements
     are relocated into the existing topbar as soon as they appear.
  */
  document.querySelectorAll(".fpost-wrap, .post-wrap").forEach(function(post) {
    const body = post.querySelector(":scope > .fpost-body, :scope > .post-body");

    if (!body) return;

    let scheduled = false;

    const observer = new MutationObserver(function() {
      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(function() {
        scheduled = false;

        if (post.classList.contains("fpost-wrap")) {
          const index = Array.from(document.querySelectorAll(".fpost-wrap")).indexOf(post);
          processFancyPost(post, index);
        } else {
          const index = Array.from(document.querySelectorAll(".post-wrap")).indexOf(post);
          processHeaderlessPost(post, index);
        }
      });
    });

    observer.observe(body, {
      childList: true,
      subtree: true
    });
  });


  /* =========================
     Global close
     ========================= */

  document.addEventListener("click", function(e) {
    if (!e.target.closest(".post-control-toggle")) {
      closePostControlPopups();
    }
  });

});
