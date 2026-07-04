// Salas UTS — Aplicación de escritorio (Electron)
// Levanta el backend Express (Prisma + Supabase) dentro del proceso principal
// y muestra el frontend React en una ventana nativa.

const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PORT = 4599;
const APP_URL = `http://127.0.0.1:${PORT}`;

// En desarrollo los recursos viven junto a este archivo; empaquetado, en resourcesPath
const resourcesDir = app.isPackaged ? process.resourcesPath : __dirname;
const backendDir = path.join(resourcesDir, 'backend-runtime');
const staticDir = app.isPackaged
  ? path.join(resourcesDir, 'frontend')
  : path.join(__dirname, '..', 'frontend', 'dist-desktop');

// Instancia única: si ya hay una ventana abierta, enfocarla en vez de abrir otra
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow = null;

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

function loadBackendConfig() {
  // Variables de conexión (Supabase) y del servidor local
  const configPath = path.join(backendDir, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  for (const [key, value] of Object.entries(config)) {
    process.env[key] = value;
  }
  process.env.PORT = String(PORT);
  process.env.STATIC_DIR = staticDir;
}

function startBackend() {
  loadBackendConfig();
  require(path.join(backendDir, 'dist', 'index.js'));
}

// Espera a que el backend responda en /api/health antes de mostrar la ventana
function waitForServer(retries = 50) {
  return new Promise((resolve, reject) => {
    const attempt = (left) => {
      const req = http.get(`${APP_URL}/api/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        retry(left);
      });
      req.on('error', () => retry(left));
      req.setTimeout(1000, () => { req.destroy(); retry(left); });
    };
    const retry = (left) => {
      if (left <= 0) return reject(new Error('El servidor local no respondió'));
      setTimeout(() => attempt(left - 1), 200);
    };
    attempt(retries);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: '#1A6732',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.maximize();
  mainWindow.loadURL(APP_URL);
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Los enlaces externos se abren en el navegador del sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  try {
    startBackend();
    await waitForServer();
    createWindow();
  } catch (err) {
    dialog.showErrorBox(
      'Salas UTS — Error al iniciar',
      `No se pudo iniciar la aplicación.\n\nVerifique su conexión a internet (la aplicación necesita acceso a la base de datos en la nube).\n\nDetalle: ${err.message}`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
