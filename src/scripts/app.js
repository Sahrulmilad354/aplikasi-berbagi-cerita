import Router from './utils/router';
import routes from './routes/routes';

const App = {
  init() {
    Router.init({
      initialPage: '/home',
      routes,
    });
  },
};

export default App;