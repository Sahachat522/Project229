// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  login: (payload) => ipcRenderer.invoke('login', payload),
  register: (payload) => ipcRenderer.invoke('register', payload),
  addTask: (payload) => ipcRenderer.invoke('add-task', payload),
  getTasks: () => ipcRenderer.invoke('get-tasks')
})

// All the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })

