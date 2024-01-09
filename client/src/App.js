import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Redux
import { Provider } from 'react-redux';
import store from './store';
import { loadUser } from './actions/authAction';

import './App.css';
import Alert from './components/layout/Alert';
import setAuthToken from './utils/setAuthToken';

if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  useEffect(() => {
    store.dispatch(loadUser());
  },[]);

  return (
    <Provider store={store}>
      <Router>
        <Navbar />
        <Routes>
          <Route exact path='/' element={<Landing />} />
          <Route
            path='/login'
            element={
              <section className='container'>
                <Alert />
                <Login />
              </section>
            }
          />
          <Route
            path='/register'
            element={
              <section className='container'>
                <Alert />
                <Register />
              </section>
            }
          />
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;
