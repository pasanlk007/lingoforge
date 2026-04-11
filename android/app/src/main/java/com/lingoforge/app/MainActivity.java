package com.lingoforge.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthentication;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Configure the plugin on app start. This is crucial for initializing
    // native services like Google Sign-In correctly.
    FirebaseAuthentication.configure(savedInstanceState, this);
  }
}
