package com.black94.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.os.Message;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONException;
import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {

    private static final String APP_URL = "https://black94.web.app";
    private static final int FILE_CHOOSER_RESULT_CODE = 1001;
    private static final int REQUEST_STORAGE_PERMISSION = 2001;

    private WebView webView;
    private ProgressBar progressBar;
    private View offlineView;
    private View loadingView;
    private FrameLayout webViewContainer;

    private ValueCallback<Uri[]> filePathCallback;
    private WebView popupWebView;
    private AlertDialog popupDialog;

    // ── Native JavaScript Bridge ───────────────────────────────────────────
    public class WebAppInterface {
        private final Context context;

        WebAppInterface(Context context) {
            this.context = context;
        }

        /** Trigger native haptic feedback */
        @JavascriptInterface
        public void haptic(String type) {
            try {
                Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
                if (vibrator != null && vibrator.hasVibrator()) {
                    if ("light".equals(type)) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            vibrator.vibrate(VibrationEffect.createOneShot(15, VibrationEffect.DEFAULT_AMPLITUDE));
                        } else {
                            vibrator.vibrate(15);
                        }
                    } else if ("medium".equals(type)) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            vibrator.vibrate(VibrationEffect.createOneShot(30, 180));
                        } else {
                            vibrator.vibrate(30);
                        }
                    } else if ("heavy".equals(type)) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            vibrator.vibrate(VibrationEffect.createOneShot(50, 255));
                        } else {
                            vibrator.vibrate(50);
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }

        /** Open native share sheet */
        @JavascriptInterface
        public void shareText(String title, String text) {
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("text/plain");
            if (title != null && !title.isEmpty()) intent.putExtra(Intent.EXTRA_SUBJECT, title);
            intent.putExtra(Intent.EXTRA_TEXT, text);
            context.startActivity(Intent.createChooser(intent, "Share via"));
        }

        /** Copy text to clipboard */
        @JavascriptInterface
        public void copyToClipboard(String text) {
            ClipboardManager clipboard = (ClipboardManager) context.getSystemService(Context.CLIPBOARD_SERVICE);
            ClipData clip = ClipData.newPlainText("Black94", text);
            clipboard.setPrimaryClip(clip);
            showToast("Copied to clipboard");
        }

        /** Check network connectivity */
        @JavascriptInterface
        public boolean isOnline() {
            ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    NetworkCapabilities cap = cm.getNetworkCapabilities(cm.getActiveNetwork());
                    return cap != null && (cap.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                            || cap.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)
                            || cap.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET));
                } else {
                    NetworkInfo info = cm.getActiveNetworkInfo();
                    return info != null && info.isConnected();
                }
            }
            return false;
        }

        /** Get app version info */
        @JavascriptInterface
        public String getAppInfo() {
            try {
                JSONObject info = new JSONObject();
                info.put("versionName", context.getPackageManager()
                        .getPackageInfo(context.getPackageName(), 0).versionName);
                info.put("versionCode", context.getPackageManager()
                        .getPackageInfo(context.getPackageName(), 0).versionCode);
                info.put("packageName", context.getPackageName());
                info.put("platform", "android");
                info.put("isNative", true);
                return info.toString();
            } catch (Exception e) {
                return "{}";
            }
        }

        /** Get device info */
        @JavascriptInterface
        public String getDeviceInfo() {
            try {
                JSONObject info = new JSONObject();
                info.put("brand", Build.BRAND);
                info.put("model", Build.MODEL);
                info.put("sdk", Build.VERSION.SDK_INT);
                info.put("version", Build.VERSION.RELEASE);
                return info.toString();
            } catch (Exception e) {
                return "{}";
            }
        }

        /** Show native toast */
        @JavascriptInterface
        public void showToast(String message) {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
        }

        /** Open URL in external browser */
        @JavascriptInterface
        public void openExternal(String url) {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Full immersive mode
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }

        // ── Build the layout programmatically ──────────────────────────────
        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(0xFF000000);
        setContentView(rootLayout);

        // Native loading spinner
        loadingView = createLoadingView();
        rootLayout.addView(loadingView);

        // WebView container
        webViewContainer = new FrameLayout(this);
        rootLayout.addView(webViewContainer, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        // Native progress bar at top
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setProgress(0);
        progressBar.setVisibility(View.GONE);
        FrameLayout.LayoutParams pbParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, 6);
        progressBar.setLayoutParams(pbParams);
        rootLayout.addView(progressBar);

        // Native offline/error screen
        offlineView = createOfflineView();
        offlineView.setVisibility(View.GONE);
        rootLayout.addView(offlineView);

        // ── Configure WebView ──────────────────────────────────────────────
        webView = new WebView(this);
        webViewContainer.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setDatabaseEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        // CRITICAL: Enable multi-window for Google Auth popups to work
        settings.setSupportMultipleWindows(true);
        settings.setUserAgentString(settings.getUserAgentString() + " Black94App/1.8.0");

        // Enable geolocation if needed
        settings.setGeolocationEnabled(true);

        // ── Cookie persistence ─────────────────────────────────────────────
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // ── Add native JavaScript bridge ───────────────────────────────────
        webView.addJavascriptInterface(new WebAppInterface(this), "Black94Native");

        // ── WebChromeClient: handles popups, file uploads, progress, console
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                    loadingView.setVisibility(View.GONE);
                }
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                // Silently consume console messages
                return true;
            }

            /** Handle Google Auth popup windows */
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                popupWebView = new WebView(MainActivity.this);
                popupWebView.getSettings().setJavaScriptEnabled(true);
                popupWebView.getSettings().setDomStorageEnabled(true);
                popupWebView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
                popupWebView.getSettings().setSupportMultipleWindows(false);
                popupWebView.getSettings().setUserAgentString(
                        view.getSettings().getUserAgentString());
                CookieManager.getInstance().setAcceptThirdPartyCookies(popupWebView, true);

                popupWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        String url = request.getUrl().toString();
                        // When Google auth redirects back to our app domain, close popup
                        if (url.contains("black94.web.app") || url.contains(APP_URL)) {
                            // Let the popup finish and signal the result
                            if (popupDialog != null && popupDialog.isShowing()) {
                                popupDialog.dismiss();
                            }
                            return false;
                        }
                        return false;
                    }

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        // If we redirected back to our domain, close the popup
                        if (url.contains("black94.web.app") || url.contains(APP_URL)) {
                            if (popupDialog != null && popupDialog.isShowing()) {
                                popupDialog.dismiss();
                            }
                        }
                    }
                });

                popupWebView.setWebChromeClient(new WebChromeClient());

                LinearLayout popupLayout = new LinearLayout(MainActivity.this);
                popupLayout.setOrientation(LinearLayout.VERTICAL);
                popupLayout.addView(popupWebView, new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        LinearLayout.LayoutParams.MATCH_PARENT));

                popupDialog = new AlertDialog.Builder(MainActivity.this)
                        .setView(popupLayout)
                        .setCancelable(true)
                        .setOnCancelListener(dialog -> {
                            popupWebView.destroy();
                            popupWebView = null;
                        })
                        .create();

                popupDialog.setOnDismissListener(dialog -> {
                    if (popupWebView != null) {
                        popupWebView.destroy();
                        popupWebView = null;
                    }
                });

                popupDialog.show();
                // Make popup full-screen
                Window window = popupDialog.getWindow();
                if (window != null) {
                    WindowManager.LayoutParams lp = window.getAttributes();
                    lp.width = WindowManager.LayoutParams.MATCH_PARENT;
                    lp.height = WindowManager.LayoutParams.MATCH_PARENT;
                    window.setAttributes(lp);
                }

                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(popupWebView);
                resultMsg.sendToTarget();

                return true;
            }

            @Override
            public void onCloseWindow(WebView window) {
                if (popupDialog != null && popupDialog.isShowing()) {
                    popupDialog.dismiss();
                }
            }

            /** File upload support for images/documents */
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             WebChromeClient.FileChooserParams fileChooserParams) {
                MainActivity.this.filePathCallback = filePathCallback;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                        && ContextCompat.checkSelfPermission(MainActivity.this,
                        Manifest.permission.READ_EXTERNAL_STORAGE)
                        != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(MainActivity.this,
                            new String[]{Manifest.permission.READ_EXTERNAL_STORAGE},
                            REQUEST_STORAGE_PERMISSION);
                } else {
                    openFileChooser();
                }
                return true;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }
        });

        // ── WebViewClient: navigation, error handling, offline detection ───
        webView.setWebViewClient(new WebViewClient() {
            private int errorCount = 0;

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith(APP_URL) || url.startsWith("https://black94.web.app")) {
                    return false;
                }
                // Open external links in browser
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                } catch (Exception ignored) {
                }
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
                offlineView.setVisibility(View.GONE);
                webViewContainer.setVisibility(View.VISIBLE);
                errorCount = 0;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                loadingView.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                // Only show offline screen for main frame errors
                if (request.isForMainFrame() && isNetworkError(error.getErrorCode())) {
                    errorCount++;
                    if (errorCount >= 2) {
                        showOfflineScreen();
                    }
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                // Only handle main frame HTTP errors
                if (request.isForMainFrame() && errorResponse.getStatusCode() >= 500) {
                    showOfflineScreen();
                }
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setData(Uri.parse(url));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } catch (Exception e) {
                Toast.makeText(MainActivity.this, "Cannot open download", Toast.LENGTH_SHORT).show();
            }
        });

        // ── Check connectivity and load ────────────────────────────────────
        if (isNetworkAvailable()) {
            loadApp(savedInstanceState);
        } else {
            showOfflineScreen();
        }
    }

    private boolean isNetworkError(int errorCode) {
        // WebView error codes that indicate network issues
        return errorCode == WebViewClient.ERROR_HOST_LOOKUP
                || errorCode == WebViewClient.ERROR_CONNECT
                || errorCode == WebViewClient.ERROR_TIMEOUT
                || errorCode == WebViewClient.ERROR_TOO_MANY_REQUESTS
                || errorCode == WebViewClient.ERROR_IO;
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                NetworkCapabilities cap = cm.getNetworkCapabilities(cm.getActiveNetwork());
                return cap != null && (cap.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                        || cap.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)
                        || cap.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET));
            } else {
                NetworkInfo info = cm.getActiveNetworkInfo();
                return info != null && info.isConnected();
            }
        }
        return false;
    }

    private void loadApp(Bundle savedInstanceState) {
        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(APP_URL);
        }
    }

    private void showOfflineScreen() {
        webViewContainer.setVisibility(View.GONE);
        offlineView.setVisibility(View.VISIBLE);
        loadingView.setVisibility(View.GONE);
        progressBar.setVisibility(View.GONE);
    }

    /** Create native loading spinner view */
    private View createLoadingView() {
        FrameLayout layout = new FrameLayout(this);
        layout.setBackgroundColor(0xFF000000);
        layout.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN);

        LinearLayout inner = new LinearLayout(this);
        inner.setOrientation(LinearLayout.VERTICAL);
        inner.setGravity(android.view.Gravity.CENTER);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT);
        lp.gravity = android.view.Gravity.CENTER;
        inner.setLayoutParams(lp);

        ProgressBar spinner = new ProgressBar(this);
        spinner.setIndeterminate(true);
        spinner.setIndeterminateTintList(android.content.res.ColorStateList.valueOf(0xFF3b82f6));
        LinearLayout.LayoutParams spinnerLp = new LinearLayout.LayoutParams(80, 80);
        spinner.setLayoutParams(spinnerLp);
        inner.addView(spinner);

        layout.addView(inner);
        return layout;
    }

    /** Create native offline/error screen */
    private View createOfflineView() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(0xFF000000);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setPadding(48, 0, 48, 0);

        TextView iconText = new TextView(this);
        iconText.setText("!");
        iconText.setTextSize(48);
        iconText.setTextColor(0xFF3b82f6);
        iconText.setGravity(android.view.Gravity.CENTER);
        iconText.setTypeface(null, android.graphics.Typeface.BOLD);
        LinearLayout.LayoutParams iconLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        iconLp.gravity = android.view.Gravity.CENTER;
        iconLp.bottomMargin = 24;
        iconText.setLayoutParams(iconLp);
        layout.addView(iconText);

        TextView titleText = new TextView(this);
        titleText.setText("No Connection");
        titleText.setTextSize(24);
        titleText.setTextColor(0xFFFFFFFF);
        titleText.setTypeface(null, android.graphics.Typeface.BOLD);
        titleText.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        titleLp.gravity = android.view.Gravity.CENTER;
        titleLp.bottomMargin = 12;
        titleText.setLayoutParams(titleLp);
        layout.addView(titleText);

        TextView descText = new TextView(this);
        descText.setText("Check your internet connection and try again.");
        descText.setTextSize(14);
        descText.setTextColor(0xFF888888);
        descText.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams descLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        descLp.gravity = android.view.Gravity.CENTER;
        descLp.bottomMargin = 32;
        descText.setLayoutParams(descLp);
        layout.addView(descText);

        // Retry button
        android.widget.Button retryBtn = new android.widget.Button(this);
        retryBtn.setText("Retry");
        retryBtn.setTextColor(0xFFFFFFFF);
        retryBtn.setBackgroundColor(0xFF3b82f6);
        retryBtn.setPadding(48, 16, 48, 16);
        retryBtn.setAllCaps(false);
        retryBtn.setOnClickListener(v -> {
            if (isNetworkAvailable()) {
                webViewContainer.setVisibility(View.VISIBLE);
                offlineView.setVisibility(View.GONE);
                webView.reload();
            } else {
                Toast.makeText(MainActivity.this, "Still no connection", Toast.LENGTH_SHORT).show();
            }
        });
        LinearLayout.LayoutParams btnLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        btnLp.gravity = android.view.Gravity.CENTER;
        retryBtn.setLayoutParams(btnLp);
        layout.addView(retryBtn);

        return layout;
    }

    /** Open native file chooser */
    private void openFileChooser() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        String[] mimeTypes = {"image/*", "video/*", "application/pdf"};
        intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false);
        startActivityForResult(Intent.createChooser(intent, "Select File"), FILE_CHOOSER_RESULT_CODE);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    ClipData clip = data.getClipData();
                    results = new Uri[clip.getItemCount()];
                    for (int i = 0; i < clip.getItemCount(); i++) {
                        results[i] = clip.getItemAt(i).getUri();
                    }
                } else if (data.getData() != null) {
                    results = new Uri[]{data.getData()};
                }
            }
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_STORAGE_PERMISSION) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                openFileChooser();
            } else if (filePathCallback != null) {
                filePathCallback.onReceiveValue(null);
                filePathCallback = null;
            }
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onRestoreInstanceState(Bundle savedInstanceState) {
        super.onRestoreInstanceState(savedInstanceState);
        webView.restoreState(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            // Native exit confirmation dialog
            new AlertDialog.Builder(this)
                    .setMessage("Exit Black94?")
                    .setPositiveButton("Exit", (dialog, which) -> {
                        finish();
                        System.exit(0);
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                getWindow().setDecorFitsSystemWindows(false);
            } else {
                getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                );
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Re-check connectivity when returning to app
        if (offlineView.getVisibility() == View.VISIBLE && isNetworkAvailable()) {
            webViewContainer.setVisibility(View.VISIBLE);
            offlineView.setVisibility(View.GONE);
            webView.reload();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        if (popupWebView != null) {
            popupWebView.destroy();
        }
        super.onDestroy();
    }
}
