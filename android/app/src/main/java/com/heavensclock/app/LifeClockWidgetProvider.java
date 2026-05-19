package com.heavensclock.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.util.Locale;

public class LifeClockWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, LifeClockWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(component);
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        WidgetSnapshot snapshot = readSnapshot(context);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_life_clock);

        views.setTextViewText(R.id.widget_memento, snapshot.memento);
        views.setTextViewText(R.id.widget_days, String.valueOf(snapshot.daysLeft));
        views.setTextViewText(R.id.widget_days_label, snapshot.daysLabel);
        views.setTextViewText(R.id.widget_percent, snapshot.percentLeft + "%");
        views.setTextViewText(R.id.widget_quote, snapshot.quote);

        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        manager.updateAppWidget(appWidgetId, views);
    }

    private static WidgetSnapshot readSnapshot(Context context) {
        String raw = context
            .getSharedPreferences("heavens_clock_widget", Context.MODE_PRIVATE)
            .getString("snapshot", "{}");

        try {
            JSONObject json = new JSONObject(raw);
            String locale = json.optString("locale", Locale.getDefault().toLanguageTag());
            JSONObject labels = json.optJSONObject("labels");
            return new WidgetSnapshot(
                json.optInt("daysLeft", 0),
                json.optDouble("percentLeft", 0),
                label(labels, "memento", "Memento Mori"),
                label(labels, "daysLeft", defaultDaysLabel(locale)),
                textOrDefault(json.optString("quote", ""), defaultQuote(locale))
            );
        } catch (Exception ignored) {
            String locale = Locale.getDefault().toLanguageTag();
            return new WidgetSnapshot(0, 0, "Memento Mori", defaultDaysLabel(locale), defaultQuote(locale));
        }
    }

    private static String label(JSONObject labels, String key, String fallback) {
        if (labels == null) return fallback;
        return textOrDefault(labels.optString(key, ""), fallback);
    }

    private static String textOrDefault(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }

    private static boolean isKorean(String locale) {
        return locale != null && locale.toLowerCase(Locale.ROOT).startsWith("ko");
    }

    private static String defaultDaysLabel(String locale) {
        return isKorean(locale) ? "남은 일수" : "DAYS LEFT";
    }

    private static String defaultQuote(String locale) {
        return isKorean(locale) ? "Heaven's Clock을 열어 시작하세요." : "Open Heaven's Clock to begin.";
    }

    private static class WidgetSnapshot {
        final int daysLeft;
        final String percentLeft;
        final String memento;
        final String daysLabel;
        final String quote;

        WidgetSnapshot(int daysLeft, double percentLeft, String memento, String daysLabel, String quote) {
            this.daysLeft = daysLeft;
            this.percentLeft = String.format(java.util.Locale.US, "%.2f", percentLeft);
            this.memento = memento;
            this.daysLabel = daysLabel;
            this.quote = quote;
        }
    }
}

