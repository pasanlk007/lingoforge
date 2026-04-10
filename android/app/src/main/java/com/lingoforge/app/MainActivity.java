package com.lingoforge.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import dev.robingenz.capacitorFirebaseAuthentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(FirebaseAuthenticationPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
