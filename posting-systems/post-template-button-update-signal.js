document.addEventListener("DOMContentLoaded", function () {
  requestAnimationFrame(function () {
    markChangedPostingTemplateLinksAcrossPages();
  });

  async function markChangedPostingTemplateLinksAcrossPages() {
    const seenByOwner = {};


    const historyPageUrls = getEarlierThreadPageUrls();

    console.log(
      "Posting-template scanner history pages:",
      historyPageUrls
    );

    if (historyPageUrls.length) {
      try {
        const historyDocs = await Promise.all(
          historyPageUrls.map(function (url) {
            return fetchPageAsDocument(url);
          })
        );

        historyDocs.forEach(function (historyDoc) {
          scanTemplatesForLinks({
            root: historyDoc,
            seenByOwner: seenByOwner,
            markChanges: false
          });
        });
      } catch (error) {
        console.warn(
          "Could not scan one or more earlier thread pages for posting-template changes:",
          error
        );

  
        for (let i = 0; i < historyPageUrls.length; i++) {
          try {
            const historyDoc =
              await fetchPageAsDocument(historyPageUrls[i]);

            scanTemplatesForLinks({
              root: historyDoc,
              seenByOwner: seenByOwner,
              markChanges: false
            });
          } catch (pageError) {
            console.warn(
              "Skipping unavailable earlier thread page:",
              historyPageUrls[i],
              pageError
            );
          }
        }
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
    const links =
      Array.from(
        config.template.querySelectorAll(config.selector)
      );

    let link = null;

    if (config.iconClass) {
      link = links.find(function (candidate) {
        return Boolean(
          candidate.querySelector(
            "." + config.iconClass
          )
        );
      });
    } else {
      link = links[0] || null;
    }

    if (!link) return;

    const currentUrl =
      normalizeUrl(link.href);

    if (!currentUrl) return;

    const previousUrl =
      config.seenByOwner[
        config.ownerKey
      ][config.type];

    if (
      config.markChanges &&
      previousUrl &&
      previousUrl !== currentUrl
    ) {
      markAsChanged(
        link,
        config.type
      );
    }

    config.seenByOwner[
      config.ownerKey
    ][config.type] = currentUrl;
  }


  function markAsChanged(link, type) {
    const labels = {
      outfit: "Outfit",
      music: "Mood music",
      gear: "Gear",
      transpo: "Transportation"
    };

    const label =
      labels[type] || "Posting template control";

    link.classList.add(
      "fpost-link-changed"
    );

    link.dataset.changedType =
      type;

    link.setAttribute(
      "title",
      label +
      " changed since this character's previous post."
    );

    link.setAttribute(
      "aria-label",
      label +
      " changed since this character's previous post."
    );
  }


  async function fetchPageAsDocument(url) {
    const response =
      await fetch(url, {
        credentials: "same-origin",
        cache: "no-store"
      });

    if (!response.ok) {
      throw new Error(
        "Failed to fetch thread page: " +
        response.status
      );
    }

    const html =
      await response.text();

    return new DOMParser()
      .parseFromString(
        html,
        "text/html"
      );
  }


  function getEarlierThreadPageUrls() {
    const currentUrl =
      new URL(window.location.href);

    const currentTopicId =
      getTopicId(currentUrl);

    const currentStart =
      getStartValue(currentUrl);

    if (currentStart <= 0) {
      return [];
    }

    const pageLinks =
      Array.from(
        document.querySelectorAll(
          "a[href*='showtopic=']"
        )
      );

    const candidates = [];

    pageLinks.forEach(function (link) {
      let linkUrl;

      try {
        linkUrl =
          new URL(
            link.href,
            window.location.href
          );
      } catch (e) {
        return;
      }

      const linkTopicId =
        getTopicId(linkUrl);

      if (
        currentTopicId &&
        linkTopicId &&
        currentTopicId !== linkTopicId
      ) {
        return;
      }

      const linkStart =
        getStartValue(linkUrl);

      if (linkStart < currentStart) {
        candidates.push({
          href: linkUrl.href,
          start: linkStart
        });
      }
    });


    const uniqueByStart = {};

    candidates.forEach(function (candidate) {
      uniqueByStart[candidate.start] =
        candidate.href;
    });

    const starts =
      Object.keys(uniqueByStart)
        .map(function (value) {
          return Number(value);
        })
        .filter(function (value) {
          return Number.isFinite(value);
        })
        .sort(function (a, b) {
          return a - b;
        });


    if (!Object.prototype.hasOwnProperty.call(uniqueByStart, "0")) {
      uniqueByStart[0] =
        buildThreadPageUrl(
          currentUrl,
          currentTopicId,
          0
        );

      starts.unshift(0);
    }

    return starts.map(function (start) {
      return uniqueByStart[start];
    });
  }


  function buildThreadPageUrl(
    currentUrl,
    topicId,
    start
  ) {
    const url =
      new URL(
        currentUrl.href
      );

    if (topicId) {
      url.searchParams.set(
        "showtopic",
        topicId
      );
    }

    if (start > 0) {
      url.searchParams.set(
        "st",
        String(start)
      );
    } else {
      url.searchParams.delete(
        "st"
      );
    }

    url.hash = "";

    return url.href;
  }


  function getTopicId(url) {
    const topicFromSearch =
      url.searchParams.get(
        "showtopic"
      );

    if (topicFromSearch) {
      return topicFromSearch;
    }

    const match =
      url.href.match(
        /showtopic[=\/](\d+)/i
      );

    return match
      ? match[1]
      : "";
  }


  function getStartValue(url) {
 
    const raw =
      url.searchParams.get(
        "st"
      );

    if (!raw) {
      return 0;
    }

    const parsed =
      parseInt(
        raw,
        10
      );

    return Number.isFinite(parsed) &&
      parsed >= 0
      ? parsed
      : 0;
  }


  function getOwnerKey(template) {
    const postShell =
      findAncestorWithOwnerInfo(
        template
      );

    if (postShell) {
      const archiveSeal =
        postShell.querySelector(
          ".archiveseal"
        );

      if (archiveSeal) {
        const fileIdMatch =
          archiveSeal.textContent.match(
            /\b\d+-\d+-\d+\b/
          );

        if (fileIdMatch) {
          return (
            "file-id:" +
            fileIdMatch[0]
          );
        }
      }

      const nameLink =
        postShell.querySelector(
          ".p-postname a[href]"
        );

      if (nameLink) {
        const href =
          nameLink.getAttribute(
            "href"
          ) || "";

        const userMatch =
          href.match(
            /[?&]showuser=(\d+)/i
          );

        if (userMatch) {
          return (
            "user-id:" +
            userMatch[1]
          );
        }

        return (
          "profile-link:" +
          href.trim()
        );
      }
    }

    return null;
  }


  function findAncestorWithOwnerInfo(startEl) {
    let node = startEl;

    while (
      node &&
      node !== document.body
    ) {
      if (
        node.querySelector &&
        (
          node.querySelector(
            ".archiveseal"
          ) ||
          node.querySelector(
            ".p-postname a[href]"
          )
        )
      ) {
        return node;
      }

      node =
        node.parentElement;
    }

    return null;
  }


  function normalizeUrl(url) {
    if (!url) {
      return "";
    }

    try {
      const parsed =
        new URL(
          url,
          window.location.href
        );

      parsed.hash = "";

      return parsed.href
        .replace(
          /\/$/,
          ""
        );
    } catch (e) {
      return String(url)
        .trim()
        .replace(
          /\/$/,
          ""
        );
    }
  }
});
