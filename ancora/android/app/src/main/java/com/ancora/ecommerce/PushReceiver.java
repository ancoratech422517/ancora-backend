package com.ancora.ecommerce;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import java.util.UUID;

public class PushReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "ancora_pushy_notifications";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        NotificationManager notificationManager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && notificationManager.getNotificationChannel(CHANNEL_ID) == null) {
            notificationManager.createNotificationChannel(new NotificationChannel(
                    CHANNEL_ID,
                    "Notificações Âncora",
                    NotificationManager.IMPORTANCE_DEFAULT
            ));
        }

        String title = intent.getStringExtra("title");
        if (title == null || title.isEmpty()) {
            title = context.getPackageManager()
                    .getApplicationLabel(context.getApplicationInfo())
                    .toString();
        }
        String message = intent.getStringExtra("message");
        if (message == null || message.isEmpty()) {
            message = "Você recebeu uma nova notificação.";
        }

        Intent openAppIntent = new Intent(context, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                UUID.randomUUID().hashCode(),
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder notification = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_ancora)
                .setContentTitle(title)
                .setContentText(message)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        notificationManager.notify(UUID.randomUUID().hashCode(), notification.build());
    }
}
