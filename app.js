// ============================================================
// app.js - Main App with AuthContext, routing, and rendering
// ============================================================
(function () {
  // ---- Auth Context ----
  const AuthContext = React.createContext(null);

  function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = React.useState(() => {
      return RTS.LS.get('rts_current_user') || null;
    });

    function login(user) {
      setCurrentUser(user);
      RTS.LS.set('rts_current_user', user);
      // Navigate to the appropriate page
      const routes = {
        elder: 'elder',
        family: 'family',
        caregiver: 'caregiver',
        doctor: 'doctor',
        admin: 'admin',
        operator: 'operator',
      };
      window.location.hash = '#/' + (routes[user.role] || 'elder');
    }

    function logout() {
      setCurrentUser(null);
      RTS.LS.set('rts_current_user', null);
      window.location.hash = '#/login';
    }

    return React.createElement(AuthContext.Provider, { value: { currentUser, login, logout } }, children);
  }

  // ---- Hash Router ----
  function useHashRoute() {
    const [route, setRoute] = React.useState(() => {
      const hash = window.location.hash.replace('#/', '') || 'landing';
      return hash || 'landing';
    });

    React.useEffect(() => {
      function onHashChange() {
        const hash = window.location.hash.replace('#/', '') || 'landing';
        setRoute(hash || 'landing');
      }
      window.addEventListener('hashchange', onHashChange);
      return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    function navigate(page) {
      window.location.hash = '#/' + page;
    }

    return [route, navigate];
  }

  // ---- Protected Route wrapper ----
  function RequireAuth({ user, allowedRoles, children, onNavigate }) {
    if (!user) {
      React.useEffect(() => { onNavigate('login'); }, []);
      return React.createElement('div', { className: 'flex items-center justify-center min-h-screen' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl mb-4' }, '🔐'),
          React.createElement('div', { className: 'text-slate-600' }, 'Đang chuyển hướng...')
        )
      );
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return React.createElement('div', { className: 'flex items-center justify-center min-h-screen' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-6xl mb-4' }, '🚫'),
          React.createElement('h2', { className: 'text-2xl font-bold text-slate-700 mb-2' }, 'Không có quyền truy cập'),
          React.createElement('p', { className: 'text-slate-500 mb-6' }, 'Tài khoản của bạn không có quyền xem trang này.'),
          React.createElement('button', {
            onClick: () => {
              const routes = { elder: 'elder', family: 'family', caregiver: 'caregiver', doctor: 'doctor', admin: 'admin', operator: 'operator' };
              onNavigate(routes[user.role] || 'landing');
            },
            className: 'px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700'
          }, 'Về trang của tôi')
        )
      );
    }
    return children;
  }

  // ---- Main App ----
  function App() {
    const [route, navigate] = useHashRoute();
    const [currentUser, setCurrentUser] = React.useState(() => RTS.LS.get('rts_current_user') || null);

    function login(user) {
      setCurrentUser(user);
      RTS.LS.set('rts_current_user', user);
      const routes = { elder: 'elder', family: 'family', caregiver: 'caregiver', doctor: 'doctor', admin: 'admin', operator: 'operator' };
      navigate(routes[user.role] || 'landing');
    }

    function logout() {
      setCurrentUser(null);
      RTS.LS.set('rts_current_user', null);
      navigate('login');
    }

    // Redirect logic: if user is logged in and on root/login/landing, go to their dashboard
    React.useEffect(() => {
      if (currentUser && (route === 'landing' || route === '' || route === 'login')) {
        // Don't redirect from landing — allow viewing it even when logged in
        if (route === 'login') {
          const routes = { elder: 'elder', family: 'family', caregiver: 'caregiver', doctor: 'doctor', admin: 'admin', operator: 'operator' };
          navigate(routes[currentUser.role] || 'elder');
        }
      }
    }, [route, currentUser]);

    // ---- Render route ----
    function renderPage() {
      switch (route) {
        case 'landing':
        case '':
          return React.createElement(LandingPage, { onNavigate: navigate });

        case 'login':
          return React.createElement(LoginPage, { onLogin: login, onNavigate: navigate });

        case 'elder':
          return React.createElement(RequireAuth, { user: currentUser, allowedRoles: ['elder'], onNavigate: navigate },
            React.createElement(ElderDashboard, { user: currentUser, onLogout: logout })
          );

        case 'family':
          return React.createElement(RequireAuth, { user: currentUser, allowedRoles: ['family'], onNavigate: navigate },
            React.createElement(FamilyDashboard, { user: currentUser, onLogout: logout })
          );

        case 'caregiver':
          return React.createElement(RequireAuth, { user: currentUser, allowedRoles: ['caregiver'], onNavigate: navigate },
            React.createElement(CaregiverDashboard, { user: currentUser, onLogout: logout })
          );

        case 'doctor':
          return React.createElement(RequireAuth, { user: currentUser, allowedRoles: ['doctor'], onNavigate: navigate },
            React.createElement(DoctorDashboard, { user: currentUser, onLogout: logout })
          );

        case 'admin':
          return React.createElement(RequireAuth, { user: currentUser, allowedRoles: ['admin'], onNavigate: navigate },
            React.createElement(AdminDashboard, { user: currentUser, onLogout: logout })
          );

        case 'operator':
          return React.createElement(RequireAuth, { user: currentUser, allowedRoles: ['operator'], onNavigate: navigate },
            React.createElement(OperatorDashboard, { user: currentUser, onLogout: logout })
          );

        default:
          return React.createElement('div', { className: 'flex items-center justify-center min-h-screen' },
            React.createElement('div', { className: 'text-center' },
              React.createElement('div', { className: 'text-8xl mb-4' }, '🤖'),
              React.createElement('h1', { className: 'text-4xl font-bold text-slate-700 mb-2' }, '404'),
              React.createElement('p', { className: 'text-slate-500 mb-6' }, 'Trang không tìm thấy'),
              React.createElement('button', {
                onClick: () => navigate('landing'),
                className: 'px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700'
              }, '← Về trang chủ')
            )
          );
      }
    }

    return React.createElement('div', { className: 'min-h-screen' }, renderPage());
  }

  // ---- Mount ----
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
})();
