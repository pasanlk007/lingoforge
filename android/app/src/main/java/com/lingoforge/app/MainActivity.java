package com.lingoforge.app;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(FirebaseAuthenticationPlugin.class);
    super.onCreate(savedInstanceState);
    WebView.setWebContentsDebuggingEnabled(true);

    // Allow getUserMedia (microphone) in the WebView for Scenario Mode voice practice
    if (getBridge() != null && getBridge().getWebView() != null) {
      getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
        @Override
        public void onPermissionRequest(PermissionRequest request) {
          request.grant(request.getResources());
        }
      });
    }
  }
}