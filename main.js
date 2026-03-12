// ===========================================================================
//  SPA router for index.html / research.html / notes.html
//  Shared components (header, navigation, footer) are inlined in every page.
//  Page-specific content lives in /content/{home,research,notes}.html and is
//  fetched once, cached, then swapped with a fade transition.
//
//  Sub-pages (e.g. notes/paper_sharing/*) have header & navigation inlined
//  too, so they only need the nav-highlight logic (legacy mode below).
// ===========================================================================

(function () {
  'use strict';

  // --- Year auto-update (works on every page) ------------------------------
  var yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // --- Detect SPA vs sub-page ----------------------------------------------
  var contentArea = document.getElementById('content-area');

  if (contentArea) {
    // =====================================================================
    //  SPA MODE — runs on index.html / research.html / notes.html
    // =====================================================================

    var ROUTES = {
      '/':              { key: 'home',     content: '/content/home.html',     title: 'Home | Zeyu CHEN' },
      '/index.html':    { key: 'home',     content: '/content/home.html',     title: 'Home | Zeyu CHEN' },
      '/research.html': { key: 'research', content: '/content/research.html', title: 'Research | Zeyu CHEN' },
      '/notes.html':    { key: 'notes',    content: '/content/notes.html',    title: 'Notes | Zeyu CHEN' },
    };

    var cache = {};

    function resolveRoute(pathname) {
      return ROUTES[pathname] || ROUTES['/index.html'];
    }

    function updateNavHighlight(key) {
      document.querySelectorAll('#navigation li').forEach(function (li) {
        li.classList.remove('li_active');
      });
      var activeLi = document.getElementById(key);
      if (activeLi) activeLi.classList.add('li_active');
    }

    function fetchContent(url) {
      if (cache[url]) return Promise.resolve(cache[url]);
      return fetch(url)
        .then(function (r) { return r.text(); })
        .then(function (html) { cache[url] = html; return html; });
    }

    function retypeset() {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([contentArea]).catch(function () {});
      }
    }

    // --- Transition engine -------------------------------------------------
    var isTransitioning = false;

    function transitionTo(route, pushState) {
      if (isTransitioning) return;
      isTransitioning = true;

      contentArea.classList.remove('visible');

      setTimeout(function () {
        fetchContent(route.content).then(function (html) {
          contentArea.innerHTML = html;
          document.title = route.title;
          updateNavHighlight(route.key);
          window.scrollTo({ top: 0 });

          if (pushState) {
            var targetPath = '/' + (route.key === 'home' ? 'index' : route.key) + '.html';
            history.pushState({ key: route.key }, '', targetPath);
          }

          requestAnimationFrame(function () {
            contentArea.classList.add('visible');
            isTransitioning = false;
            retypeset();
          });
        });
      }, 250);
    }

    // --- Navigation interception -------------------------------------------
    document.getElementById('navigation').addEventListener('click', function (e) {
      var anchor = e.target.closest('a');
      if (!anchor) return;

      var href = anchor.getAttribute('href');
      if (!href || !ROUTES[href]) return;

      e.preventDefault();
      var route = ROUTES[href];
      if (route.key === resolveRoute(location.pathname).key && !isTransitioning) return;
      transitionTo(route, true);
    });

    var nameLink = document.getElementById('name');
    if (nameLink) {
      nameLink.addEventListener('click', function (e) {
        var href = nameLink.getAttribute('href');
        if (ROUTES[href]) {
          e.preventDefault();
          var route = ROUTES[href];
          if (route.key === resolveRoute(location.pathname).key && !isTransitioning) return;
          transitionTo(route, true);
        }
      });
    }

    // --- Browser back / forward --------------------------------------------
    window.addEventListener('popstate', function () {
      var route = resolveRoute(location.pathname);
      transitionTo(route, false);
    });

    // --- Initial page load -------------------------------------------------
    var initialRoute = resolveRoute(location.pathname);

    fetchContent(initialRoute.content).then(function (html) {
      contentArea.innerHTML = html;
      document.title = initialRoute.title;
      updateNavHighlight(initialRoute.key);

      requestAnimationFrame(function () {
        contentArea.classList.add('visible');
        retypeset();
      });

      // Prefetch other fragments
      Object.values(ROUTES).forEach(function (r) {
        if (r.content !== initialRoute.content) fetchContent(r.content);
      });
    });

  } else {
    // =====================================================================
    //  SUB-PAGE MODE — runs on notes/paper_sharing/* etc.
    //  Header & navigation are already inlined; only highlight the active
    //  nav item based on current URL path.
    // =====================================================================

    var pathParts = location.pathname.split('/');
    var navKey = pathParts[1];
    if (!navKey) navKey = 'home';

    var dirToLiId = {
      'index.html': 'home',
      'notes.html': 'notes',
      'notes': 'notes',
      'research.html': 'research',
      'research': 'research',
    };

    var activeLiId = dirToLiId[navKey];
    if (activeLiId) {
      var activeLi = document.getElementById(activeLiId);
      if (activeLi) activeLi.classList.add('li_active');
    }
  }
})();

