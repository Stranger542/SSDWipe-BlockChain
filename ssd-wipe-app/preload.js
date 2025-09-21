const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Minter functions
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveCertificate: (certificateText) => ipcRenderer.invoke('dialog:saveFile', certificateText),
  mintCertificate: (args) => ipcRenderer.invoke('blockchain:mint', args),
  
  // Verifier functions
  openFileRawText: () => ipcRenderer.invoke('dialog:openFileRawText'),
  verifyCertificate: (tokenId) => ipcRenderer.invoke('blockchain:verify', tokenId),

  calculateHash: (data) => ipcRenderer.invoke('tool:hash', data)
});