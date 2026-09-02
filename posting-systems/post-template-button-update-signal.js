document.addEventListener("DOMContentLoaded", function () {
  requestAnimationFrame(function () {
    markChangedPostTemplateLinksAcrossPages();
  });

  async function markChangedPostTemplateLinksAcrossPages() {
    const seenByOwner = {};


    const previousPageUrl = getPreviousThreadPageUrl();

    console.log("Post template scanner history pages:", previousPageUrl);

    if (previousPageUrl) {
      try {
        const previousDoc = await fetchPageAsDocument(previousPageUrl);

    
        scanTemplatesForLinks({
          root: previousDoc,
          seenByOwner: seenByOwner,
          markChanges: false
        });
      } catch (error) {
        console.warn(
          "Could not scan previous thread page for post template changes:",
          previousPageUrl,
          error
        );
      }
    }

 
    scanTemplatesForLinks({
      root: document,
      seenByOwner: seenByOwner,
      markChanges: true
    });
  }

  function scanTemplatesForLinks(config) {
    const root = config.root;
    const seenByOwner = config.seenByOwner;
    const markChanges = config.markChanges;

    const templates = Array.from(
      root.querySelectorAll(".fpost-wrap, .post-wrap")
    );

    templates.forEach(function (template) {
      const ownerKey = getOwnerKey(template);
      if (!ownerKey) return;

      if (!seenByOwner[ownerKey]) {
        seenByOwner[ownerKey] = {
          outfit: null,
          music: null,
	   gear: null,
          transpo: null
        };
      }

      compareButton({
        template: template,
        ownerKey: ownerKey,
        type: "music",
        selector: ".fpost-music a",
	iconClass: "ph-music-notes",
        seenByOwner: seenByOwner,
        markChanges: markChanges
      });

      compareButton({
        template: template,
        ownerKey: ownerKey,
        type: "outfit",
        selector: ".fpost-outfit a",
	iconClass: "ph-coat-hanger",
        seenByOwner: seenByOwner,
        markChanges: markChanges
      });

	 compareButton({
        template: template,
        ownerKey: ownerKey,
        type: "gear",
        selector: ".fpost-gear a",
        iconClass: "ph-treasure-chest",
        seenByOwner: seenByOwner,
        markChanges: markChanges
      });

      compareButton({
        template: template,
        ownerKey: ownerKey,
        type: "transpo",
        selector: ".fpost-transpo a",
        iconClass: "ph-motorcycle",
        seenByOwner: seenByOwner,
        markChanges: markChanges
      });
    });
  }

  function compareButton(config) {
    const link = config.template.querySelector(config.selector);
    if (!link) return;

    const currentUrl = normalizeUrl(link.href);
    if (!currentUrl) return;

    const previousUrl = config.seenByOwner[config.ownerKey][config.type];

    if (
      config.markChanges &&
      previousUrl &&
      previousUrl !== currentUrl
    ) {
      markAsChanged(link, config.type);
    }

    config.seenByOwner[config.ownerKey][config.type] = currentUrl;
  }

  function markAsChanged(link, type) {
  const label =
    type === "outfit" ? "Outfit" :
    type === "music" ? "Mood Music" :
    type === "gear" ? "Extra Gear" :
    type === "transpo" ? "Transportation" :
    "";

  link.classList.add("fpost-link-changed");
  link.dataset.changedType = type;

  link.setAttribute(
    "title",
    label + " changed since this character's previous post."
  );

  link.setAttribute(
    "aria-label",
    label + " changed since this character's previous post."
  );
}

  async function fetchPageAsDocument(url) {
    const response = await fetch(url, {
      credentials: "same-origin"
    });

    if (!response.ok) {
      throw new Error("Failed to fetch previous page: " + response.status);
    }

    const html = await response.text();

    return new DOMParser().parseFromString(html, "text/html");
  }

  function getPreviousThreadPageUrl() {
    const currentUrl = new URL(window.location.href);
    const currentTopicId = getTopicId(currentUrl);
    const currentStart = getStartValue(currentUrl);

    if (currentStart <= 0) {
      return null;
    }

    const pageLinks = Array.from(
      document.querySelectorAll("a[href*='showtopic=']")
    );

    const candidates = [];

    pageLinks.forEach(function (link) {
      let linkUrl;

      try {
        linkUrl = new URL(link.href, window.location.href);
      } catch (e) {
        return;
      }

      const linkTopicId = getTopicId(linkUrl);

      if (currentTopicId && linkTopicId && currentTopicId !== linkTopicId) {
        return;
      }

      const linkStart = getStartValue(linkUrl);

      if (linkStart < currentStart) {
        candidates.push({
          href: linkUrl.href,
          start: linkStart
        });
      }
    });

    if (candidates.length) {
      candidates.sort(function (a, b) {
        return b.start - a.start;
      });

      return candidates[0].href;
    }

    return null;
  }

  function getTopicId(url) {
    const topicFromSearch = url.searchParams.get("showtopic");

    if (topicFromSearch) {
      return topicFromSearch;
    }

    const match = url.href.match(/showtopic[=\/](\d+)/i);

    return match ? match[1] : "";
  }

  function getStartValue(url) {
    const raw = url.searchParams.get("st");

    if (!raw) return 0;

    const parsed = parseInt(raw, 10);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getOwnerKey(template) {
    const postShell = findAncestorWithOwnerInfo(template);

    if (postShell) {
      const archiveSeal = postShell.querySelector(".archiveseal");

      if (archiveSeal) {
        const fileIdMatch = archiveSeal.textContent.match(/\b\d+-\d+-\d+\b/);

        if (fileIdMatch) {
          return "file-id:" + fileIdMatch[0];
        }
      }

      const nameLink = postShell.querySelector(".p-postname a[href]");

      if (nameLink) {
        const href = nameLink.getAttribute("href") || "";
        const userMatch = href.match(/[?&]showuser=(\d+)/i);

        if (userMatch) {
          return "user-id:" + userMatch[1];
        }

        return "profile-link:" + href.trim();
      }
    }

    return null;
  }

  function findAncestorWithOwnerInfo(startEl) {
    let node = startEl;

    while (node && node !== document.body) {
      if (
        node.querySelector &&
        (
          node.querySelector(".archiveseal") ||
          node.querySelector(".p-postname a[href]")
        )
      ) {
        return node;
      }

      node = node.parentElement;
    }

    return null;
  }

  function normalizeUrl(url) {
    if (!url) return "";

    try {
      const parsed = new URL(url, window.location.href);
      parsed.hash = "";

      return parsed.href.replace(/\/$/, "");
    } catch (e) {
      return String(url).trim().replace(/\/$/, "");
    }
  }
});
