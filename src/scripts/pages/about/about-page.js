const AboutPage = {
  render() {
    return `
      <section>
        <h1>Tentang Aplikasi</h1>
        <h2>Deskripsi</h2>
        <h3>Tujuan</h3>
      </section>
    `;
  },

  afterRender() {
    console.log('About loaded');
  },
};

export default AboutPage;