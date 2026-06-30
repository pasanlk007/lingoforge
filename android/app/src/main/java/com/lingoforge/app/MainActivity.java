package com.lingoforge.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(FirebaseAuthenticationPlugin.class);
    super.onCreate(savedInstanceState);
    // TEMPORARY: enables chrome://inspect to attach to this app's WebView even
    // in a release/Internal-Testing build, so real crashes can be diagnosed via
    // Chrome DevTools console. Remove this line before the real production
    // Play Store release (debuggable WebView is a minor info-exposure risk).
    WebView.setWebContentsDebuggingEnabled(true);
  }
}
