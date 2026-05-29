package com.heavensclock.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

public final class ReminderScheduler {
    private static final String PREFS = "heavens_clock_reminders";
    private static final String KEY_CONFIG = "config";

    private ReminderScheduler() {}

    public static void configureFromJson(Context context, String json) {
        context
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_CONFIG, json == null ? "{}" : json)
            .apply();

        cancelAll(context);
        try {
            JSONObject root = new JSONObject(json == null ? "{}" : json);
            if (!root.optBoolean("enabled", false)) {
                return;
            }
            JSONArray reminders = root.optJSONArray("reminders");
            if (reminders == null) return;
            for (int i = 0; i < reminders.length(); i++) {
                JSONObject item = reminders.optJSONObject(i);
                if (item == null) continue;
                String id = item.optString("id", "reminder_" + i);
                String time = item.optString("time", "");
                String title = item.optString("title", "Heaven's Clock");
                String body = item.optString("body", "");
                scheduleDaily(context, id, time, title, body);
            }
        } catch (Exception ignored) {}
    }

    public static void rescheduleFromPrefs(Context context) {
        String json = context
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_CONFIG, "{}");
        configureFromJson(context, json);
    }

    public static void cancelAll(Context context) {
        AlarmManager alarm = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarm == null) return;
        for (int i = 0; i < 16; i++) {
            String id = "reminder_" + i;
            PendingIntent pi = pendingIntent(context, id, "", "", PendingIntent.FLAG_NO_CREATE);
            if (pi != null) {
                alarm.cancel(pi);
                pi.cancel();
            }
        }
        String[] fixedIds = new String[] { "intention", "focus", "review" };
        for (String id : fixedIds) {
            PendingIntent pi = pendingIntent(context, id, "", "", PendingIntent.FLAG_NO_CREATE);
            if (pi != null) {
                alarm.cancel(pi);
                pi.cancel();
            }
        }
    }

    private static void scheduleDaily(Context context, String id, String hhmm, String title, String body) {
        int[] parsed = parseHourMinute(hhmm);
        if (parsed == null) return;
        int hour = parsed[0];
        int minute = parsed[1];

        Calendar now = Calendar.getInstance();
        Calendar next = Calendar.getInstance();
        next.set(Calendar.HOUR_OF_DAY, hour);
        next.set(Calendar.MINUTE, minute);
        next.set(Calendar.SECOND, 0);
        next.set(Calendar.MILLISECOND, 0);
        if (!next.after(now)) next.add(Calendar.DAY_OF_YEAR, 1);

        AlarmManager alarm = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarm == null) return;
        PendingIntent pi = pendingIntent(context, id, title, body, 0);
        alarm.setInexactRepeating(
            AlarmManager.RTC_WAKEUP,
            next.getTimeInMillis(),
            AlarmManager.INTERVAL_DAY,
            pi
        );
    }

    private static PendingIntent pendingIntent(
        Context context,
        String id,
        String title,
        String body,
        int extraFlags
    ) {
        Intent intent = new Intent(context, ReminderReceiver.class);
        intent.putExtra("id", id);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        int flags = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT | extraFlags;
        return PendingIntent.getBroadcast(context, id.hashCode(), intent, flags);
    }

    private static int[] parseHourMinute(String hhmm) {
        if (hhmm == null || !hhmm.matches("^\\d{2}:\\d{2}$")) return null;
        try {
            int hour = Integer.parseInt(hhmm.substring(0, 2));
            int minute = Integer.parseInt(hhmm.substring(3, 5));
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
            return new int[] { hour, minute };
        } catch (Exception ignored) {
            return null;
        }
    }
}
