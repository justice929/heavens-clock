package com.heavensclock.app;

import android.content.Context;
import android.os.Bundle;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        bridge.getWebView().addJavascriptInterface(new WidgetBridge(this), "HeavensClockBridge");
    }

    public static class WidgetBridge {
        private final Context context;

        WidgetBridge(Context context) {
            this.context = context.getApplicationContext();
        }

        @JavascriptInterface
        public void saveWidgetSnapshot(String json) {
            context
                .getSharedPreferences("heavens_clock_widget", Context.MODE_PRIVATE)
                .edit()
                .putString("snapshot", json)
                .apply();
            LifeClockWidgetProvider.updateAll(context);
        }
    }
}
