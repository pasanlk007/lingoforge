package com.lingoforge.app;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(FirebaseAuthenticationPlugin.class);
    super.onCreate(savedInstanceState);
    WebView.setWebContentsDebuggingEnabled(true);
  }

  @Override
  public void onStart() {
    super.onStart();
    if (getBridge() != null && getBridge().getWebView() != null) {
      getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
        @Override
        public void onPermissionRequest(PermissionRequest request) {
          request.grant(request.getResources());
        }
      });
    }
  }
}