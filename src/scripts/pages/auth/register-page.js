import {
  showLoading,
  closeLoading,
  showSuccess,
  showError,
} from '../../utils/alert-helper';

const RegisterPage = {
  async render() {
    return `
      <section class="login">
        <div class="login__card">
          <h1 class="login__title">Buat Akun 📝</h1>
          <h2 class="login__title">Selamat Datang</h2>
          <p class="login__subtitle">
            Daftar untuk Mulai Berbagi Cerita
          </p>

          <form
            id="register-form"
            class="login__form"
          >
            <div class="form-group">
              <label for="name">Nama</label>
              <input
                type="text"
                id="name"
                placeholder="Masukkan nama"
                required
              />
            </div>

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
              <label for="password">
                Password
              </label>
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
              id="register-button"
            >
              Register
            </button>

            <p
              style="
                text-align:center;
                margin-top:10px;
              "
            >
              Sudah punya akun?
              <a href="#/login">Login</a>
            </p>
          </form>

          <p
            id="message"
            class="form-message"
          ></p>
        </div>
      </section>
    `;
  },

  async afterRender() {
    const form =
      document.querySelector(
        '#register-form'
      );

    const message =
      document.querySelector('#message');

    const registerButton =
      document.querySelector(
        '#register-button'
      );

    form.addEventListener(
      'submit',
      async (e) => {
        e.preventDefault();

        const name =
          document.querySelector(
            '#name'
          ).value;

        const email =
          document.querySelector(
            '#email'
          ).value;

        const password =
          document.querySelector(
            '#password'
          ).value;

        // Disable button saat loading
        registerButton.disabled = true;

        registerButton.textContent =
          'Sedang Register...';

        try {
          showLoading(
            'Sedang mendaftarkan akun...'
          );

          const response =
            await fetch(
              'https://story-api.dicoding.dev/v1/register',
              {
                method: 'POST',
                headers: {
                  'Content-Type':
                    'application/json',
                },
                body: JSON.stringify({
                  name,
                  email,
                  password,
                }),
              }
            );

          const data =
            await response.json();

          closeLoading();

          // Aktifkan kembali button
          registerButton.disabled = false;

          registerButton.textContent =
            'Register';

          if (data.error) {
            message.innerText =
              data.message;

            showError(data.message);
          } else {
            message.innerText =
              'Registrasi berhasil! Silakan login.';

            showSuccess(
              'Registrasi berhasil'
            );

            // Delay redirect
            setTimeout(() => {
              window.location.hash =
                '#/login';
            }, 1500);
          }
        } catch (error) {
          closeLoading();

          // Aktifkan kembali button
          registerButton.disabled = false;

          registerButton.textContent =
            'Register';

          message.innerText =
            'Registrasi gagal';

          showError(
            'Terjadi kesalahan saat registrasi'
          );

          console.error(error);
        }
      }
    );
  },
};

export default RegisterPage;