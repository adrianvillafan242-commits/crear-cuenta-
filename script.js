/* script.js - maneja registro, login, recuperación y bienvenida */

/* --- Expresiones regulares según tu enunciado --- */
const regex = {
  correo: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  nombre: /^[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/,
  celular: /^[0-9]{7,12}$/,
  pass4: /^.{4}$/ // exactamente 4 caracteres (cualquier caracter incluido símbolo)
};

/* --- helpers localStorage: guardamos varios usuarios bajo 'users' --- */
function readUsers() {
  const raw = localStorage.getItem('users');
  return raw ? JSON.parse(raw) : [];
}
function writeUsers(list) {
  localStorage.setItem('users', JSON.stringify(list));
}

/* --- Mensajes en DOM --- */
function showMessage(elId, text, type='error') {
  const el = document.getElementById(elId);
  if (!el) return;
  el.style.display = 'block';
  el.className = 'message ' + (type === 'success' ? 'success' : 'error');
  el.textContent = text;
  // se oculta tras 5s
  setTimeout(()=> { if(el) el.style.display='none'; }, 5000);
}

/* --- Mostrar/ocultar password toggles --- */
document.addEventListener('DOMContentLoaded', () => {
  // toggles por id si existen
  const toggles = [
    {chk: 'toggleLoginPass', pass: 'loginPass'},
    {chk: 'toggleRegPass', pass: 'regPass'},
    {chk: 'toggleRecPass', pass: 'recPass'}
  ];
  toggles.forEach(t=>{
    const cb = document.getElementById(t.chk);
    const pw = document.getElementById(t.pass);
    if(cb && pw) {
      cb.addEventListener('change', ()=> {
        pw.type = cb.checked ? 'text' : 'password';
      });
    }
  });

  // inicializar formularios si existen en la página actual
  initRegistro();
  initLogin();
  initRecuperar();
  initBienvenida();
});

/* ------------- REGISTRO ------------- */
function initRegistro() {
  const form = document.getElementById('formRegistro');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('regNombre').value.trim();
    const email  = document.getElementById('regEmail').value.trim().toLowerCase();
    const cel    = document.getElementById('regCel').value.trim();
    const pass   = document.getElementById('regPass').value;

    // validaciones
    if (!regex.nombre.test(nombre)) {
      showMessage('regMsg', 'Nombre inválido. Solo letras y espacios.', 'error'); return;
    }
    if (!regex.correo.test(email)) {
      showMessage('regMsg', 'Correo inválido.', 'error'); return;
    }
    if (!regex.celular.test(cel)) {
      showMessage('regMsg', 'Número de móvil inválido. 7 a 12 dígitos.', 'error'); return;
    }
    if (!regex.pass4.test(pass)) {
      showMessage('regMsg', 'La contraseña debe tener exactamente 4 caracteres.', 'error'); return;
    }

    // comprobar si usuario ya existe
    const users = readUsers();
    if (users.some(u => u.email === email)) {
      showMessage('regMsg', 'Ya existe una cuenta con ese correo.', 'error'); return;
    }

    // crear usuario
    const newUser = {
      nombre,
      email,
      celular: cel,
      pass,
      intentos: 0,
      bloqueado: false
    };
    users.push(newUser);
    writeUsers(users);

    showMessage('regMsg', 'Cuenta creada con éxito. Redirigiendo al inicio...', 'success');

    setTimeout(()=> { window.location.href = 'index.html'; }, 1200);
  });
}

/* ------------- LOGIN ------------- */
function initLogin() {
  const form = document.getElementById('formLogin');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass  = document.getElementById('loginPass').value;

    const users = readUsers();
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex === -1) {
      showMessage('loginMsg', 'Usuario o contraseña incorrectos.', 'error'); return;
    }

    const user = users[userIndex];

    if (user.bloqueado) {
      showMessage('loginMsg', 'Cuenta bloqueada por intentos fallidos. Recupera la contraseña.', 'error');
      // opcional: enfocar el link de recuperar
      return;
    }

    if (user.pass !== pass) {
      user.intentos = (user.intentos || 0) + 1;
      if (user.intentos >= 3) {
        user.bloqueado = true;
        showMessage('loginMsg', 'Cuenta bloqueada por intentos fallidos.', 'error');
      } else {
        showMessage('loginMsg', `Contraseña incorrecta. Intentos: ${user.intentos}`, 'error');
      }
      users[userIndex] = user;
      writeUsers(users);
      return;
    }

    // login correcto
    user.intentos = 0;
    user.bloqueado = false;
    users[userIndex] = user;
    writeUsers(users);

    // guardar sesión en sessionStorage
    sessionStorage.setItem('session', JSON.stringify({ email: user.email, nombre: user.nombre }));

    // muestra mensaje rápido y redirige a bienvenida
    showMessage('loginMsg', `Bienvenido al sistema, ${user.nombre}`, 'success');
    setTimeout(()=> { window.location.href = 'bienvenida.html'; }, 800);
  });
}

/* ------------- RECUPERAR ------------- */
function initRecuperar() {
  const form = document.getElementById('formRecuperar');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('recEmail').value.trim().toLowerCase();
    const newPass = document.getElementById('recPass').value;
    const conf = document.getElementById('recConf').value;

    if (!regex.correo.test(email)) {
      showMessage('recMsg', 'Correo inválido.', 'error'); return;
    }
    if (!regex.pass4.test(newPass)) {
      showMessage('recMsg', 'La contraseña debe tener exactamente 4 caracteres.', 'error'); return;
    }
    if (newPass !== conf) {
      showMessage('recMsg', 'Las contraseñas no coinciden.', 'error'); return;
    }

    const users = readUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx === -1) {
      showMessage('recMsg', 'No existe una cuenta con ese correo.', 'error'); return;
    }

    // actualizar contraseña y desbloquear
    users[idx].pass = newPass;
    users[idx].intentos = 0;
    users[idx].bloqueado = false;
    writeUsers(users);

    showMessage('recMsg', 'Contraseña cambiada. Cuenta desbloqueada. Redirigiendo al inicio...', 'success');
    setTimeout(()=> { window.location.href = 'index.html'; }, 1200);
  });
}

/* ------------- BIENVENIDA ------------- */
function initBienvenida() {
  // solo si la página tiene el ID welcomeTitle
  const title = document.getElementById('welcomeTitle');
  if (!title) return;

  const session = sessionStorage.getItem('session');
  if (!session) {
    // si no hay sesión, regresar al inicio
    window.location.href = 'index.html';
    return;
  }
  const user = JSON.parse(session);
  title.textContent = `Bienvenido, ${user.nombre}`;
  const p = document.getElementById('welcomeMsg');
  p.textContent = 'Has ingresado correctamente.';

  const btnCerrar = document.getElementById('btnCerrar');
  btnCerrar.addEventListener('click', () => {
    sessionStorage.removeItem('session');
    window.location.href = 'index.html';
  });
}
