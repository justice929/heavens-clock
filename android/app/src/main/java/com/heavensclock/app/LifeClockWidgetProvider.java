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

        views.setTextViewText(R.id.widget_memento, "Memento Mori");
        views.setTextViewText(R.id.widget_days, String.valueOf(snapshot.daysLeft));
        views.setTextViewText(R.id.widget_days_label, "DAYS LEFT");
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
            return new WidgetSnapshot(
                json.optInt("daysLeft", 0),
                json.optDouble("percentLeft", 0),
                json.optString("quote", "Open Heaven's Clock to begin.")
            );
        } catch (Exception ignored) {
            return new WidgetSnapshot(0, 0, "Open Heaven's Clock to begin.");
        }
    }

    private static class WidgetSnapshot {
        final int daysLeft;
        final String percentLeft;
        final String quote;

        WidgetSnapshot(int daysLeft, double percentLeft, String quote) {
            this.daysLeft = daysLeft;
            this.percentLeft = String.format(java.util.Locale.US, "%.2f", percentLeft);
            this.quote = quote;
        }
    }
}

