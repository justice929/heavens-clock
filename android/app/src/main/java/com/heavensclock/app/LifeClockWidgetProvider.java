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

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
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
        views.setTextViewText(R.id.widget_years, String.valueOf(snapshot.years));
        views.setTextViewText(R.id.widget_days, String.valueOf(snapshot.days));
        views.setTextViewText(R.id.widget_hours, snapshot.hoursText);
        views.setTextViewText(R.id.widget_years_label, snapshot.yearLabel);
        views.setTextViewText(R.id.widget_days_label, snapshot.dayLabel);
        views.setTextViewText(R.id.widget_hours_label, snapshot.hourLabel);
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
            RemainingParts parts = resolveRemainingParts(json);

            return new WidgetSnapshot(
                parts.years,
                parts.days,
                parts.hours,
                json.optDouble("percentLeft", 0),
                label(labels, "memento", "Memento Mori"),
                label(labels, "yearUnit", defaultYearLabel(locale)),
                label(labels, "dayUnit", defaultDayLabel(locale)),
                label(labels, "hourUnit", defaultHourLabel(locale)),
                textOrDefault(json.optString("quote", ""), defaultQuote(locale))
            );
        } catch (Exception ignored) {
            String locale = Locale.getDefault().toLanguageTag();
            return new WidgetSnapshot(
                0, 0, 0, 0,
                "Memento Mori",
                defaultYearLabel(locale),
                defaultDayLabel(locale),
                defaultHourLabel(locale),
                defaultQuote(locale)
            );
        }
    }

    /** Prefer live calculation from targetAt; fall back to stored breakdown fields. */
    private static RemainingParts resolveRemainingParts(JSONObject json) {
        String targetAt = json.optString("targetAt", "");
        if (!targetAt.isEmpty()) {
            try {
                Instant target = Instant.parse(targetAt);
                ZonedDateTime now = ZonedDateTime.now(ZoneId.systemDefault());
                ZonedDateTime targetZdt = target.atZone(ZoneId.systemDefault());
                return remainingParts(now, targetZdt);
            } catch (Exception ignored) {
                // fall through to stored fields
            }
        }
        return new RemainingParts(
            json.optInt("yearsLeft", 0),
            json.optInt("daysLeft", 0),
            json.optInt("hoursLeft", 0)
        );
    }

    /** Same calendar breakdown as the in-app clock (years → days → hours). */
    static RemainingParts remainingParts(ZonedDateTime from, ZonedDateTime to) {
        if (!to.isAfter(from)) {
            return new RemainingParts(0, 0, 0);
        }

        ZonedDateTime cursor = from;
        int years = 0;
        while (true) {
            ZonedDateTime next = cursor.plusYears(1);
            if (next.isAfter(to)) break;
            years++;
            cursor = next;
        }

        int days = 0;
        while (true) {
            ZonedDateTime next = cursor.plusDays(1);
            if (next.isAfter(to)) break;
            days++;
            cursor = next;
        }

        long ms = java.time.Duration.between(cursor, to).toMillis();
        int hours = (int) Math.floor(ms / 3_600_000L);
        return new RemainingParts(years, days, hours);
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

    private static String defaultYearLabel(String locale) {
        return isKorean(locale) ? "년" : "YEAR";
    }

    private static String defaultDayLabel(String locale) {
        return isKorean(locale) ? "일" : "DAY";
    }

    private static String defaultHourLabel(String locale) {
        return isKorean(locale) ? "시" : "HOUR";
    }

    private static String defaultQuote(String locale) {
        return isKorean(locale) ? "Heaven's Clock을 열어 시작하세요." : "Open Heaven's Clock to begin.";
    }

    static class RemainingParts {
        final int years;
        final int days;
        final int hours;

        RemainingParts(int years, int days, int hours) {
            this.years = years;
            this.days = days;
            this.hours = hours;
        }
    }

    private static class WidgetSnapshot {
        final int years;
        final int days;
        final String hoursText;
        final String percentLeft;
        final String memento;
        final String yearLabel;
        final String dayLabel;
        final String hourLabel;
        final String quote;

        WidgetSnapshot(
            int years,
            int days,
            int hours,
            double percentLeft,
            String memento,
            String yearLabel,
            String dayLabel,
            String hourLabel,
            String quote
        ) {
            this.years = years;
            this.days = days;
            this.hoursText = String.format(Locale.US, "%02d", hours);
            this.percentLeft = String.format(Locale.US, "%.2f", percentLeft);
            this.memento = memento;
            this.yearLabel = yearLabel;
            this.dayLabel = dayLabel;
            this.hourLabel = hourLabel;
            this.quote = quote;
        }
    }
}
