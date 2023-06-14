const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();
if (require('electron-squirrel-startup')) app.quit();

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 1200,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Adicione esta linha
            enableRemoteModule: true  // Adicione esta linha
        }
    });
   // win.webContents.openDevTools();
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('electron-store-get-data', async (event, key) => {
    const value = store.get(key, null);
    return value;
});

ipcMain.handle('electron-store-set-data', async (event, key, value) => {
    store.set(key, value);
});