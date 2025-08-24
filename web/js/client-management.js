
// Generates a unique client ID using a simple UUID-like format
function generateClientId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Stores the client ID in LocalStorage
function setClientId() {
  let clientId = localStorage.getItem('clientId');
  if (!clientId) {
    clientId = generateClientId();
    localStorage.setItem('clientId', clientId);
  }
  return clientId;
}

// Retrieves the client ID from LocalStorage
function getClientId() {
  return localStorage.getItem('clientId') || setClientId();
}

// Updates the client ID (generates a new one and stores it)
function updateClientId() {
  const newClientId = generateClientId();
  localStorage.setItem('clientId', newClientId);
  return newClientId;
}

// Deletes the client ID from LocalStorage
function deleteClientId() {
  localStorage.removeItem('clientId');
  return true;
}

// Checks if a client ID exists in LocalStorage
function hasClientId() {
  return !!localStorage.getItem('clientId');
}
