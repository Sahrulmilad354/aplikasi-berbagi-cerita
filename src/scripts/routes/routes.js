import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import AddPage from '../pages/add/add-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/auth/register-page';

const routes = {
  '/': HomePage,
  '/home': HomePage,
  '/about': AboutPage,
  '/add': AddPage, 
  '/login': LoginPage,
  '/register': RegisterPage,
};

export default routes;