'use strict';

{{ $searchDataFile := printf "js/%s.search-data.js" .Language.Lang }}
{{ $searchData := resources.Get "js/search-data.js" | resources.ExecuteAsTemplate $searchDataFile . | resources.Minify | resources.Fingerprint }}

(function() {
  const input = document.querySelector('#gdoc-search-input');
  const results = document.querySelector('#gdoc-search-results');
  let showParent = false

  {{ if .Site.Params.GeekdocSearchShowParent  }}
    showParent = true
  {{ end }}

  input.addEventListener('focus', init);
  input.addEventListener('keyup', search);

  function init() {
    input.removeEventListener('focus', init); // init once
    input.required = true;

    loadScript('{{ index .Site.Data.assets "js/flexsearch.min.js" | relURL }}');
    loadScript('{{ $searchData.RelPermalink }}', function() {
      input.required = false;
      search();
    });
    loadScript('{{ index .Site.Data.assets "js/groupBy.min.js" | relURL }}');
  }

  function search() {
    while (results.firstChild) {
      results.removeChild(results.firstChild);
    }

    if (!input.value) {
      console.log("empty")
      results.classList.remove("has-hits");
      return;
    }

    let searchHits = window.geekdocSearchIndex.search(input.value, 10);

    console.log(searchHits.length);
    if (searchHits.length < 1) {
      return results.classList.remove("has-hits");
    }

    results.classList.add("has-hits");

    if (showParent) {
      searchHits = groupBy(searchHits, hit => hit.parent);
    }

    const items = [];

    for (const section in searchHits) {
      const item = document.createElement('li');

      if (showParent) {
        const title = item.appendChild(document.createElement('span'));
        title.textContent = section;
      }

      const subList = item.appendChild(document.createElement('ul'));
      createLinks(searchHits[section], subList);

      items.push(item);
    }

    items.forEach(item => {
      results.appendChild(item);
    })
  }

  /**
   * Creates links to given pages and either returns them in an array or attaches them to a target element
   * @param {Object} pages Page to which the link should point to
   * @param {HTMLElement} target Element to which the links should be attatched
   * @returns {Array} If target is not specified, returns an array of built links
   */
  function createLinks(pages, target) {
    const items = [];

    for (const page of pages) {
      const item = document.createElement("li"),
            entry = item.appendChild(document.createElement("span")),
            a = entry.appendChild(document.createElement("a"));

      entry.classList.add("flex")

      a.href = page.href;
      a.textContent = page.title;
      a.classList.add("gdoc-search__entry")

      if (target) {
        target.appendChild(item);
        continue
      }

      items.push(item);
    }

    return items;
  }

  function loadScript(src, callback) {
    const script = document.createElement('script');
    script.defer = true;
    script.async = false;
    script.src = src;
    script.onload = callback;

    document.head.appendChild(script);
  }
})();
