import Swal from 'sweetalert2';

export function showLoading(message = 'Memproses data...') {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function closeLoading() {
  Swal.close();
}

export function showSuccess(message) {
  Swal.fire({
    icon: 'success',
    title: 'Berhasil',
    text: message,
    timer: 2000,
    showConfirmButton: false,
  });
}

export function showError(message) {
  Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text: message,
  });
}