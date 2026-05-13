import {
  showLoading,
  closeLoading,
  showSuccess,
  showError,
} from '../../utils/alert-helper';

const LoginPage = {
  async render() {
    return `
      <section class="login">
        <div class="login__card">
          <h1 class="login__title">Masuk ke Akun Anda</h1>
          <h2 class="login__title">Selamat Datang 👋</h2>
          <p class="login__subtitle">
            Silakan Login untuk Melanjutkan
          </p>

          <form id="login-form" class="login__form">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="Masukkan email"
                required
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Masukkan password"
                required
              />
            </div>

            <button
              type="submit"
              class="btn-primary"
              id="login-button"
            >
              Login
            </button>

            <p style="text-align:center; margin-top:10px;">
              Belum punya akun?
              <a href="#/register">Daftar</a>
            </p>
          </form>

          <p id="message" class="form-message"></p>
        </div>
      </section>
    `;
  },

  async afterRender() {
    const form = document.querySelector('#login-form');
    const message = document.querySelector('#message');
    const loginButton =
      document.querySelector('#login-button');

    form.addEventListener(
      'submit',
      async (e) => {
        e.preventDefault();

        const email =
          document.querySelector('#email').value;

        const password =
          document.querySelector('#password').value;

        // Disable button saat loading
        loginButton.disabled = true;
        loginButton.textContent =
          'Sedang Login...';

        try {
          showLoading('Sedang login...');

          const response = await fetch(
            'https://story-api.dicoding.dev/v1/login',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                email,
                password,
              }),
            }
          );

          const data = await response.json();

          closeLoading();

          // Aktifkan kembali button
          loginButton.disabled = false;
          loginButton.textContent = 'Login';

          if (data.error) {
            message.innerText =
              data.message;

            showError(data.message);
          } else {
            localStorage.setItem(
              'token',
              data.loginResult.token
            );

            message.innerText =
              'Login berhasil!';

            showSuccess(
              'Login berhasil'
            );

            setTimeout(() => {
              window.location.hash =
                '#/home';
            }, 1500);
          }
        } catch (error) {
          closeLoading();

          // Aktifkan kembali button
          loginButton.disabled = false;
          loginButton.textContent = 'Login';

          message.innerText =
            'Login gagal';

          showError(
            'Terjadi kesalahan saat login'
          );

          console.error(error);
        }
      }
    );
  },
};

export default LoginPage;