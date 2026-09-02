package com.stepsbuild.logbook;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    // App Links (see AndroidManifest.xml) launch the app with the tapped
    // URL as intent data. Capacitor otherwise always reloads the configured
    // server.url, so point the WebView at the actual link that was tapped.
    private void handleIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data != null && "logbook.stepsbuild.com".equals(data.getHost())) {
            getBridge().getWebView().loadUrl(data.toString());
        }
    }
}
