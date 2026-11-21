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
    
    // Luôn yêu cầu đăng nhập khi mở phiên làm việc mới, không tự động lưu đăng nhập vĩnh viễn
    // để bảo mật và thuận tiện cho việc trình diễn demo cho thầy
    const [currentUser, setCurrentUser] = React.useState(() => {
      try {
        const stored = sessionStorage.getItem('rts_current_user');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    });

    // Clear old localStorage user if exists to avoid unwanted auto-login
    React.useEffect(() => {
      localStorage.removeItem('rts_current_user');
    }, []);

    // ---- Auth guard ----
    React.useEffect(() => {
      if (currentUser && currentUser.role !== 'family') {
        sessionStorage.removeItem('rts_current_user');
        localStorage.removeItem('rts_current_user');
        setCurrentUser(null);
        navigate('login');
        return;
      }
      if (!currentUser && PROTECTED.includes(route)) {
        navigate('login');
        return;
      }
      if (currentUser && route === 'login') {
        navigate('family');
        return;
      }
      if (!APP_ROUTES.includes(route)) {
        navigate(currentUser ? 'family' : 'login');
      }
    }, [route, currentUser]);

    function login(user) {
      if (!user || user.role !== 'family') return;
      // Reset cờ cài đặt khi chọn tài khoản demo cài đặt từ đầu
      if (user.demoSetupMode) {
        localStorage.removeItem('myka_setup_complete_' + user.id);
        localStorage.removeItem('myka_device_paired_' + user.id);
        localStorage.removeItem('myka_setup_complete_family');
        sessionStorage.removeItem('myka_setup_complete_' + user.id);
      }
      setCurrentUser(user);
      sessionStorage.setItem('rts_current_user', JSON.stringify(user));
      navigate('family');
    }

    function logout() {
      setCurrentUser(null);
      sessionStorage.removeItem('rts_current_user');
      localStorage.removeItem('rts_current_user');
      // Reset toàn bộ cờ cài đặt để lần demo tiếp theo có thể thử lại quy trình kết nối từ đầu
      localStorage.removeItem('myka_setup_complete_U-DEMO-SETUP');
      localStorage.removeItem('myka_device_paired_U-DEMO-SETUP');
      localStorage.removeItem('myka_setup_complete_family');
      sessionStorage.removeItem('myka_setup_complete_U-DEMO-SETUP');
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
        if (allowedRoute !== route) {
          navigate(allowedRoute || 'login');
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
              onClick: () => navigate('login'),
              className: 'px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700'
            }, '← Về đăng nhập')
          ));
      }
    }

    return React.createElement('div', { className: 'min-h-screen' }, renderPage());
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
})();
