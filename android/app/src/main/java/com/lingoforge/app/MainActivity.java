package com.lingoforge.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {

  private static final int MIC_PERMISSION_REQUEST = 101;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(FirebaseAuthenticationPlugin.class);
    super.onCreate(savedInstanceState);
    WebView.setWebContentsDebuggingEnabled(true);

    // Request RECORD_AUDIO at runtime if not yet granted
    if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
        != PackageManager.PERMISSION_GRANTED) {
      ActivityCompat.requestPermissions(
        this,
        new String[]{ Manifest.permission.RECORD_AUDIO },
        MIC_PERMISSION_REQUEST
      );
    }
  }

  @Override
  public void onStart() {
    super.onStart();
    // Grant WebView microphone access via WebChromeClient
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