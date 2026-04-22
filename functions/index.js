const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

const messaging = getMessaging();
const adminDb = getFirestore();

// Send push notification when a new notification is created in Firestore
exports.sendPushNotification = onDocumentCreated(
  {
    document: 'notifications/{notificationId}',
    region: 'asia-south1',
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const notification = snapshot.data();
    const userId = notification.userId;
    const actorName = notification.actorName || 'Someone';
    const type = notification.type || 'notification';
    const message = notification.message || '';

    try {
      // Get user's FCM tokens
      const tokenDoc = await adminDb.collection('fcmTokens').doc(userId).get();
      if (!tokenDoc.exists) {
        console.log(`No FCM tokens found for user ${userId}`);
        return null;
      }

      const tokens = tokenDoc.data().tokens || [];
      if (tokens.length === 0) {
        console.log(`Empty token array for user ${userId}`);
        return null;
      }

      // Build notification message based on type
      let title = '';
      let body = '';

      switch (type) {
        case 'like':
          title = `${actorName} liked your post`;
          body = message || 'Tap to see the post';
          break;
        case 'comment':
          title = `${actorName} commented on your post`;
          body = message || 'Tap to read the comment';
          break;
        case 'follow':
          title = `${actorName} started following you`;
          body = 'Tap to view their profile';
          break;
        case 'repost':
          title = `${actorName} reposted your post`;
          body = 'Tap to see the repost';
          break;
        case 'message':
          title = `${actorName} sent you a message`;
          body = message || 'Tap to read';
          break;
        case 'mention':
          title = `${actorName} mentioned you`;
          body = message || 'Tap to see';
          break;
        case 'engagement':
          title = `Your post is trending!`;
          body = message || `${actorName} — Keep the momentum going!`;
          break;
        default:
          title = 'Black94';
          body = message || 'You have a new notification';
      }

      // Send multicast message to all user tokens
      const pushMessage = {
        notification: {
          title,
          body,
        },
        data: {
          type,
          actorId: notification.actorId || '',
          actorName: actorName,
          postId: notification.postId || '',
          notificationId: snapshot.id,
          url: 'https://black94.web.app/#notifications',
        },
        webpush: {
          notification: {
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'black94-notification',
            requireInteraction: false,
          },
          fcm_options: {
            link: 'https://black94.web.app/#notifications',
          },
        },
        android: {
          notification: {
            icon: 'ic_stat_black94',
            color: '#FFFFFF',
            sound: 'default',
          },
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        tokens,
      };

      const response = await messaging.sendEachForMulticast(pushMessage);
      console.log(`Push sent: ${response.successCount} success, ${response.failureCount} failed`);

      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const err = resp.error;
            // Token unregistered or invalid
            if (
              err.code === 'messaging/invalid-registration-token' ||
              err.code === 'messaging/registration-token-not-registered'
            ) {
              invalidTokens.push(tokens[idx]);
            }
          }
        });
        if (invalidTokens.length > 0) {
          await adminDb.collection('fcmTokens').doc(userId).update({
            tokens: tokens.filter((t) => !invalidTokens.includes(t)),
          });
          console.log(`Removed ${invalidTokens.length} invalid tokens for user ${userId}`);
        }
      }

      return null;
    } catch (error) {
      console.error(`[Push] Error sending notification to user ${userId}:`, error);
      return null;
    }
  }
);
