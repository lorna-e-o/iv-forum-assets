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
     Fancy post template
     ========================= */

  document.querySelectorAll(".fpost-wrap").forEach(function(post, index) {
    let image = null;
    let body = null;

    Array.from(post.children).forEach(function(child) {
      if (child.classList.contains("fpost-image")) {
        image = child;
      }

      if (child.classList.contains("fpost-body")) {
        body = child;
      }
    });

    if (!image || !body) return;

    let overlay = image.querySelector(".fpost-overlay");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "fpost-overlay";
      image.appendChild(overlay);
    }

    let topbar = post.querySelector(".fpost-topbar");

    if (!topbar) {
      topbar = document.createElement("div");
      topbar.className = "fpost-topbar";
      body.parentNode.insertBefore(topbar, body);
    }

    let meta = null;
    let npcs = null;
    let qTop = null;
    let outfit = null;
    let music = null;

    Array.from(body.children).forEach(function(child) {
      if (child.classList.contains("post-meta")) {
        meta = child;
      }

      if (child.classList.contains("post-npcs")) {
        npcs = child;
      }

      if (child.classList.contains("fpost-qtop")) {
        qTop = child;
      }

      if (child.classList.contains("fpost-outfit")) {
        outfit = child;
      }

      if (child.classList.contains("fpost-music")) {
        music = child;
      }
    });

    if (qTop) {
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

    if (music) {
      topbar.appendChild(music);
    }

    if (outfit) {
      topbar.appendChild(outfit);
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
  });


  /* =========================
     Headerless post template
     ========================= */

  document.querySelectorAll(".post-wrap").forEach(function(post, index) {
    let body = null;

    Array.from(post.children).forEach(function(child) {
      if (child.classList.contains("post-body")) {
        body = child;
      }
    });

    if (!body) return;

    let topbar = post.querySelector(".post-topbar");

    if (!topbar) {
      topbar = document.createElement("div");
      topbar.className = "post-topbar";
      body.parentNode.insertBefore(topbar, body);
    }

    let meta = null;
    let npcs = null;
    let outfit = null;
    let music = null;

    Array.from(body.children).forEach(function(child) {
      if (child.classList.contains("post-meta")) {
        meta = child;
      }

      if (child.classList.contains("post-npcs")) {
        npcs = child;
      }

      if (child.classList.contains("fpost-outfit")) {
        outfit = child;
      }

      if (child.classList.contains("fpost-music")) {
        music = child;
      }
    });

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

    if (music) {
      topbar.appendChild(music);
    }

    if (outfit) {
      topbar.appendChild(outfit);
    }

    if (!topbar.children.length) {
      topbar.remove();
    }

    cleanupBodyLeadingSpace(body);
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
