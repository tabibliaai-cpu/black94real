# Add project specific ProGuard rules here.
-keepattributes *Annotation*
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keepclassmembers class * { public <init>(...); }

# Google Play Services / Sign-In
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
-keep class com.google.api.client.** { *; }
-keep class com.google.api.services.** { *; }
