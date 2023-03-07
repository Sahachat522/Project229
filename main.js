const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron')
const path = require('path')
const axios = require('axios')
const Store = require('electron-store');
const { access } = require('fs');

const store = new Store();

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  const childWin = new BrowserWindow({
    parent: mainWindow,
    frame:false,
    opacity:0.9,
    transparent:true,
    width: 700,
    height: 300,
    show:false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.webContents.openDevTools()
  // childWin.webContents.openDevTools()
  mainWindow.removeMenu()
  mainWindow.setMenu(null)
  if(!store.has('token') || (store.get('token') == '')){
    mainWindow.loadFile('src/login.html')
  }
  else{
    mainWindow.loadFile('src/index.html')
  }
  mainWindow.on('minimize',function(event){
    event.preventDefault();
    mainWindow.hide();
    childWin.removeMenu()
    childWin.setMenu(null)
    childWin.loadFile('src/index_child.html')
    childWin.show();
  });

  var appIcon = null;
  appIcon = new Tray(path.join(__dirname, 'app-icon.png'));
  var contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click:  function(){
        mainWindow.show();
        childWin.hide();
    } },
    { label: 'Quit', click:  function(){
        app.isQuiting = true;
        app.quit();
    } }
  ]);
  appIcon.setToolTip('Electron.js App');
  appIcon.setContextMenu(contextMenu);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

const checkToken = async () => {
  const userid = store.get('user_id')
  const res = await axios.get(`https://barkbark-api-cymdkybzaq-as.a.run.app/task/${userid}`, {headers:{'x-access-token': store.get('token')}}).catch((err)=>store.delete('token'));
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  console.log(store.get('token'));
  console.log(store.get('user_id'));
  console.log(store.get('username'));
  checkToken()
  createWindow()
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

ipcMain.handle("login", async (event,data) => {
  const res = await axios.post("https://barkbark-api-cymdkybzaq-as.a.run.app/login",{email:data.email, password: data.password});
  // const body = await response.text();
  console.log(res.data)
  if(res.data.token){
    store.set('token', res.data.token)
    store.set('username', res.data.data.username)
    store.set('user_id', res.data.id)
    console.log('token save')
  }
  return res.data;
})

ipcMain.handle("register", async (event,data) => {
  const res = await axios.post("https://barkbark-api-cymdkybzaq-as.a.run.app/register",{username:data.username, email:data.email, password: data.password});
  // const body = await response.text();
  // console.log(res.data)
  return res.data;
})

ipcMain.handle("add-task", async (event, data) =>{
  data.userid = store.get('user_id')
  const res = axios.post(`https://barkbark-api-cymdkybzaq-as.a.run.app/task/add`, data,{headers:{'x-access-token': store.get('token')}});
  // console.log(res)
  return res.status;
} )

ipcMain.handle("get-tasks", async () =>{
  const userid = store.get('user_id')
  const res = await axios.get(`https://barkbark-api-cymdkybzaq-as.a.run.app/task/${userid}`, {headers:{'x-access-token': store.get('token')}});
  // console.log(res.data)
  return res.data
} )

ipcMain.handle("done-task", async (event, data) => {
  const task_id = data;
  const res = await axios.get(`https://barkbark-api-cymdkybzaq-as.a.run.app/task/done/${task_id}`, {headers:{'x-access-token': store.get('token')}});
  console.log(res.data);
  return res.data
})

ipcMain.handle('get-user', async (event, data) =>{
  return store.get('username');
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

try {
  require('electron-reloader')(module)
} catch (_) {}