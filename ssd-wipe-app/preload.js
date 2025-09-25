
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  storeCertificate: (args) => ipcRenderer.invoke('blockchain:store', args), 
  openCertificateWindow: (args) => ipcRenderer.send('app:open-certificate-window', args),
  getCertificate: (certificateId) => ipcRenderer.invoke('blockchain:getCertificate', certificateId),
  // Verifier functions
  verifyCertificate: (tokenId) => ipcRenderer.invoke('blockchain:verify', tokenId),
  // Utility
  calculateHash: (data) => ipcRenderer.invoke('tool:hash', data)
});