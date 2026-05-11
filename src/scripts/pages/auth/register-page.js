const RegisterPage = {
  async render() {
    return `
      <section class="login">
        <div class="login__card">
          <h1 class="login__title">Buat Akun 📝</h1>
          <h2 class="login__title">Selamat Datang</h2>
          <p class="login__subtitle">Daftar untuk Mulai Berbagi Cerita</p>

          <form id="register-form" class="login__form">

            <div class="form-group">
              <label for="name">Nama</label>
              <input type="text" id="name" placeholder="Masukkan nama" required />
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" placeholder="Masukkan email" required />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" placeholder="Masukkan password" required />
            </div>

            <button type="submit" class="btn-primary">Register</button>
          </form>

          <p id="message" class="form-message"></p>
        </div>
      </section>
    `;
  },

  async afterRender() {
    const form = document.querySelector('#register-form');
    const message = document.querySelector('#message');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.querySelector('#name').value;
      const email = document.querySelector('#email').value;
      const password = document.querySelector('#password').value;

      message.innerText = 'Loading...';

      try {
        const response = await fetch('https://story-api.dicoding.dev/v1/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (data.error) {
          message.innerText = data.message;
        } else {
          message.innerText = 'Registrasi berhasil! Silakan login.';
          
          // Delay 
          setTimeout(() => {
            window.location.hash = '#/login';
          }, 1500);
        }
      } catch (error) {
        message.innerText = 'Registrasi gagal';
      }
    });
  },
};

export default RegisterPage;