const authService = {
    accessToken: null,
    clientId: '',

    startAuth() {
        const id = prompt('Paste your Google OAuth2 Client ID:');
        if (!id) return;
        this.clientId = id.trim();
        
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: window.location.origin,
            response_type: 'token',
            scope: 'https://www.googleapis.com/auth/gmail.send'
        });

        const popup = window.open('https://accounts.google.com/o/oauth2/v2/auth?' + params, 'google-oauth', 'width=500,height=600');
        
        const timer = setInterval(() => {
            try {
                if (popup.location.href.includes('access_token')) {
                    clearInterval(timer);
                    const hash = new URLSearchParams(popup.location.href.split('#')[1]);
                    this.accessToken = hash.get('access_token');
                    popup.close();
                    uiHandler.onAuthSuccess();
                }
            } catch (e) {}
        }, 500);
    }
};