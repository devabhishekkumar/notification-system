# Notification System

A full-stack notification management system built with Django REST Framework and React. The system allows an admin to manage notification triggers, templates, channel settings, test notifications, and notification logs from a single dashboard.

The system supports three notification channels:

- Email
- WhatsApp
- Web Push

---

## Features

- Admin notification management dashboard
- Trigger-based notification system
- Email notifications
- WhatsApp notifications
- Browser Web Push notifications
- Create notification templates
- Edit notification templates
- Enable/disable individual notification channels
- Test-send notifications
- Dynamic template variables
- Notification logs
- Browser push subscription management
- JWT authentication
- REST APIs
- Responsive React UI

---

# Notification Channels

## Email

Email notifications are sent using the Brevo API.

The admin can:

- Create an Email template
- Edit the template
- Enable/disable Email
- Test-send an Email notification
- View the result in Notification Logs

---

## WhatsApp

WhatsApp notifications are integrated using the Twilio WhatsApp Sandbox.

The admin can:

- Create a WhatsApp template
- Edit the template
- Enable/disable WhatsApp
- Test-send a WhatsApp notification
- View the result in Notification Logs

> The current implementation uses the Twilio WhatsApp Sandbox for development and testing.

---

## Web Push

Browser Web Push notifications are implemented using the Web Push API and VAPID authentication.

The browser:

1. Requests notification permission.
2. Creates a Push Subscription.
3. Sends the subscription to the Django backend.
4. The backend stores the subscription.
5. The backend sends push notifications.
6. The browser Service Worker receives and displays the notification.

---

# Notification Triggers

The notification system is trigger-based.

Example triggers:

- User Login
- User Logout
- Password Reset
- Order Placed
- User Inactivity

A single trigger can use one, two, or all three notification channels.

Example:

```text
User Login
    |
    +---- Email
    |
    +---- WhatsApp
    |
    +---- Web Push