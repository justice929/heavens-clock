package com.heavensclock.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int REQUEST_POST_NOTIFICATIONS = 2048;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = bridge.getWebView();
        webView.addJavascriptInterface(new WidgetBridge(this), "HeavensClockBridge");
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setHorizontalScrollBarEnabled(false);
        WebSettings settings = webView.getSettings();
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
    }

    public static class WidgetBridge {
        private final MainActivity activity;
        private final Context context;

        WidgetBridge(MainActivity activity) {
            this.activity = activity;
            this.context = activity.getApplicationContext();
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

        @JavascriptInterface
        public String requestNotificationPermission() {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                return "granted";
            }
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) {
                return "granted";
            }
            activity.runOnUiThread(() ->
                activity.requestPermissions(
                    new String[] { Manifest.permission.POST_NOTIFICATIONS },
                    REQUEST_POST_NOTIFICATIONS
                )
            );
            return "prompt";
        }

        @JavascriptInterface
        public void configureReminders(String json) {
            ReminderScheduler.configureFromJson(context, json);
        }

        @JavascriptInterface
        public void cancelReminders() {
            ReminderScheduler.cancelAll(context);
        }
    }
}
