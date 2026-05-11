const UrlParser = {
  parseActiveUrl() {
    return window.location.hash.slice(1).toLowerCase();
  },
};

export default UrlParser;