// Global types for Google API
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar.events";
const DISCOVERY_DOCS = [
  "https://sheets.googleapis.com/$discovery/rest?version=v4",
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
];

let tokenClient: any;
let isGapiLoaded = false;
let isGisLoaded = false;

export const googleIntegration = {
  // 1. Load Scripts
  init: (clientId: string, onStatusChange: (status: boolean) => void) => {
    if (!clientId) return;

    // Load GAPI
    if (!isGapiLoaded) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              discoveryDocs: DISCOVERY_DOCS,
            });
            isGapiLoaded = true;
            if (isGisLoaded) onStatusChange(true);
          } catch (err) {
            console.error("GAPI Init Error", err);
          }
        });
      };
      document.body.appendChild(script);
    }

    // Load GIS
    if (!isGisLoaded) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: '', // defined at request time
        });
        isGisLoaded = true;
        if (isGapiLoaded) onStatusChange(true);
      };
      document.body.appendChild(script);
    }
  },

  // 2. Trigger Auth Flow
  login: (onSuccess: () => void, onError: (err: any) => void) => {
    if (!tokenClient) {
      onError("Google Services not initialized. Check Client ID.");
      return;
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        onError(resp);
        throw (resp);
      }
      onSuccess();
    };

    if (window.gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' });
    }
  },

  // 3. Logout
  logout: () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken('');
    }
  },

  // 4. Check status
  isAuthenticated: () => {
    return isGapiLoaded && window.gapi.client.getToken() !== null;
  }
};