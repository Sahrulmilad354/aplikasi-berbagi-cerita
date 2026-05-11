const Router = {
  init({ initialPage, routes }) {
    this._routes = routes;
    this._initialPage = initialPage;

    window.addEventListener('hashchange', () => {
      this._loadPage();
    });

    this._loadPage();
  },

  _getActiveRoute() {
    const hash = window.location.hash.slice(1).toLowerCase();
    return hash || this._initialPage;
  },

  async _loadPage() {
    const url = this._getActiveRoute();
    const page = this._routes[url];

    if (!page) {
      document.querySelector('#app').innerHTML = '<h2>Page not found</h2>';
      return;
    }

    const content = await page.render(); 
    document.querySelector('#app').innerHTML = content;

    await page.afterRender();
  }
};

export default Router;