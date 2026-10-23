// ============================================================
// app.js - Main App (fixed auth guards, no conditional hooks)
// ============================================================
(function () {
  const ROLE_ROUTES = { family: 'family' };
  const PROTECTED = ['family'];
  const APP_ROUTES = ['landing', 'login', 'family'];

  function useHashRoute() {
    const getRoute = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      return hash || 'landing';
    };
    const [route, setRoute] = React.useState(getRoute);

    React.useEffect(() => {
      const onHashChange = () => setRoute(getRoute());
      window.addEventListener('hashchange', onHashChange);
      return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    function navigate(page) {
      window.location.hash = '#/' + page;
    }
    return [route, navigate];
  }

  function App() {
    const [route, navigate] = useHashRoute();
    const [currentUser, setCurrentUser] = React.useState(() => {
      return RTS.LS.get('rts_current_user') || null;
    });

    // ---- Auth guard (NO hooks inside conditionals) ----
    React.useEffect(() => {
      if (currentUser && currentUser.role !== 'family') {
        RTS.LS.set('rts_current_user', null);
        setCurrentUser(null);
        navigate('login');
        return;
      }
      if (!currentUser && PROTECTED.includes(route)) {
        navigate('login');
      }
      if (currentUser && route === 'login') {
        navigate('family');
      }
      if (!APP_ROUTES.includes(route)) navigate(currentUser ? 'family' : 'login');
    }, [route, currentUser]);

    function login(user) {
      if (!user || user.role !== 'family') return;
      RTS.LS.set(`myka_ever_logged_in_${user.id}`, true);
      setCurrentUser(user);
      RTS.LS.set('rts_current_user', user);
      navigate('family');
    }

    function logout() {
      setCurrentUser(null);
      RTS.LS.set('rts_current_user', null);
      navigate('login');
    }

    function renderPage() {
      // Loading state while redirecting
      if (!currentUser && PROTECTED.includes(route)) {
        return React.createElement('div', {
          className: 'flex items-center justify-center min-h-screen bg-slate-100'
        }, React.createElement('div', { className: 'text-center text-slate-400' },
          React.createElement('div', { className: 'text-5xl mb-3' }, '🔄'),
          React.createElement('div', null, 'Đang chuyển hướng...')
        ));
      }

      // Wrong role trying to access another role's page
      if (currentUser && PROTECTED.includes(route)) {
        const allowedRoute = ROLE_ROUTES[currentUser.role];
        // Only block if trying to access a DIFFERENT role's specific page
        if (allowedRoute !== route) {
          navigate(allowedRoute || 'landing');
          return React.createElement('div', {
            className: 'flex items-center justify-center min-h-screen bg-slate-100'
          }, React.createElement('div', { className: 'text-center text-slate-400' },
            React.createElement('div', { className: 'text-5xl mb-3' }, '🔄'),
            React.createElement('div', null, 'Đang chuyển hướng...')
          ));
        }
      }

      // ---- Route switch ----
      switch (route) {
        case 'landing':
        case '':
          return React.createElement(LandingPage, { onNavigate: navigate });

        case 'login':
          return React.createElement(LoginPage, { onLogin: login, onNavigate: navigate });

        case 'family':
          return React.createElement(FamilyDashboard, { user: currentUser, onLogout: logout });

        default:
          return React.createElement('div', {
            className: 'flex items-center justify-center min-h-screen bg-slate-100'
          }, React.createElement('div', { className: 'text-center' },
            React.createElement('div', { className: 'text-8xl mb-4' }, '🤖'),
            React.createElement('h1', { className: 'text-4xl font-bold text-slate-700 mb-2' }, '404'),
            React.createElement('p', { className: 'text-slate-500 mb-6' }, 'Trang không tìm thấy'),
            React.createElement('button', {
              onClick: () => navigate('landing'),
              className: 'px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700'
            }, '← Về trang chủ')
          ));
      }
    }

    return React.createElement('div', { className: 'min-h-screen' }, renderPage());
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
})();
