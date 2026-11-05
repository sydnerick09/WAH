package com.gwenohub.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.TextView;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String HOME_URL = "https://gweno.business";
    private static final String DASHBOARD_URL = HOME_URL + "/dashboard";
    private static final String PROFILE_URL = HOME_URL + "/profile";
    private static final String WITHDRAW_URL = HOME_URL + "/withdraw";
    private static final int FILE_CHOOSER_REQUEST = 4102;

    private WebView webView;
    private LinearLayout bottomNavigation;
    private ValueCallback<Uri[]> filePathCallback;
    private FrameLayout splashOverlay;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private long launchStartedAt;
    private boolean pageReady = false;
    private boolean splashHidden = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        launchStartedAt = android.os.SystemClock.elapsedRealtime();
        Window window = getWindow();
        window.setStatusBarColor(Color.BLACK);
        window.setNavigationBarColor(Color.BLACK);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
        }

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.WHITE);
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        webView.setVisibility(View.INVISIBLE);
        splashOverlay = buildSplashScreen();
        root.addView(splashOverlay, new FrameLayout.LayoutParams(-1, -1));
        mainHandler.postDelayed(() -> {
            if (!splashHidden) {
                // Fail open if a slow or unavailable network prevents page load.
                pageReady = true;
                webView.setVisibility(View.VISIBLE);
                hideSplashScreen();
            }
        }, 12000);

        // Navigation is rendered by the app-only React shell so it stays
        // consistent across every route without duplicating a second native bar.
        bottomNavigation = null;
        setContentView(root);
        applySystemBarInsets(root);

        WebSettings settings = webView.getSettings();
        settings.setUserAgentString(settings.getUserAgentString() + " GWENOAndroidApp");
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) settings.setSafeBrowsingEnabled(true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST);
                    return true;
                } catch (ActivityNotFoundException e) {
                    finishFileChooser(null);
                    Toast.makeText(MainActivity.this, "No file picker is available on this device.",
                            Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                pageReady = true;
                long elapsed = android.os.SystemClock.elapsedRealtime() - launchStartedAt;
                long remaining = Math.max(0, 700 - elapsed);
                mainHandler.postDelayed(() -> {
                    webView.setVisibility(View.VISIBLE);
                    hideSplashScreen();
                }, remaining);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleNavigation(request.getUrl());
            }
            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleNavigation(Uri.parse(url));
            }
        });

        if (savedInstanceState != null) webView.restoreState(savedInstanceState);
        if (webView.getUrl() == null) webView.loadUrl(HOME_URL);
    }

    private FrameLayout buildSplashScreen() {
        FrameLayout overlay = new FrameLayout(this);
        overlay.setBackgroundColor(Color.BLACK);
        LinearLayout brand = new LinearLayout(this);
        brand.setOrientation(LinearLayout.VERTICAL);
        brand.setGravity(Gravity.CENTER);
        TextView name = new TextView(this);
        name.setText("GWENOHUB");
        name.setTextColor(Color.WHITE);
        name.setTextSize(30);
        name.setLetterSpacing(0.10f);
        name.setTypeface(Typeface.create("sans-serif", Typeface.BOLD));
        name.setGravity(Gravity.CENTER);
        TextView tagline = new TextView(this);
        tagline.setText("Work • Earn • Grow");
        tagline.setTextColor(Color.WHITE);
        tagline.setTextSize(13);
        tagline.setLetterSpacing(0.035f);
        tagline.setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
        tagline.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams taglineParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        taglineParams.topMargin = dp(8);
        brand.addView(name);
        brand.addView(tagline, taglineParams);
        FrameLayout.LayoutParams centered = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER);
        overlay.addView(brand, centered);
        return overlay;
    }

    private void hideSplashScreen() {
        if (splashHidden || !pageReady) return;
        splashHidden = true;
        if (splashOverlay != null) {
            splashOverlay.animate().alpha(0f).setDuration(160).withEndAction(() -> {
                if (splashOverlay != null) {
                    splashOverlay.setVisibility(View.GONE);
                    splashOverlay = null;
                }
            }).start();
        }
    }

    private LinearLayout buildBottomNavigation() {
        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER);
        bar.setBackgroundColor(Color.rgb(11, 15, 25));
        bar.setElevation(dp(8));
        addNavItem(bar, "⌂", "Dashboard", () -> webView.loadUrl(DASHBOARD_URL));
        addNavItem(bar, "▣", "My Wallet", this::showWalletOptions);
        addNavItem(bar, "✓", "Tasks", () -> webView.loadUrl(DASHBOARD_URL + "#tasks"));
        addNavItem(bar, "●", "My Profile", () -> webView.loadUrl(PROFILE_URL));
        return bar;
    }

    private void addNavItem(LinearLayout bar, String icon, String label, Runnable action) {
        LinearLayout item = new LinearLayout(this);
        item.setOrientation(LinearLayout.VERTICAL);
        item.setGravity(Gravity.CENTER);
        item.setClickable(true);
        item.setFocusable(true);
        item.setBackgroundResource(android.R.drawable.list_selector_background);
        TextView symbol = new TextView(this);
        symbol.setText(icon);
        symbol.setTextColor(Color.WHITE);
        symbol.setTextSize(21);
        symbol.setGravity(Gravity.CENTER);
        symbol.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        TextView caption = new TextView(this);
        caption.setText(label);
        caption.setTextColor(Color.WHITE);
        caption.setTextSize(10);
        caption.setGravity(Gravity.CENTER);
        caption.setSingleLine(true);
        item.addView(symbol);
        item.addView(caption);
        item.setOnClickListener(v -> action.run());
        bar.addView(item, new LinearLayout.LayoutParams(0, dp(64), 1f));
    }

    private void showWalletOptions() {
        PopupMenu menu = new PopupMenu(this, bottomNavigation.getChildAt(1));
        menu.getMenu().add("Other Countries").setOnMenuItemClickListener(i -> {
            webView.loadUrl(WITHDRAW_URL + "?method=international"); return true;
        });
        menu.getMenu().add("M-Pesa").setOnMenuItemClickListener(i -> {
            webView.loadUrl(WITHDRAW_URL + "?method=mpesa"); return true;
        });
        menu.getMenu().add("Airtel Money").setOnMenuItemClickListener(i -> {
            webView.loadUrl(WITHDRAW_URL + "?method=airtel"); return true;
        });
        menu.show();
    }

    private void applySystemBarInsets(View root) {
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            int left = 0, right = 0, top = 0, bottom = 0;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.graphics.Insets bars = insets.getInsets(
                        WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                left = bars.left; right = bars.right; top = bars.top; bottom = bars.bottom;
            } else {
                top = insets.getSystemWindowInsetTop();
                bottom = insets.getSystemWindowInsetBottom();
                left = insets.getSystemWindowInsetLeft();
                right = insets.getSystemWindowInsetRight();
            }
            webView.setPadding(left, top, right, bottom);
            return insets;
        });
    }

    private boolean handleNavigation(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        if ("https".equals(scheme) &&
                ("gweno.business".equals(host) || "www.gweno.business".equals(host))) return false;
        if ("http".equals(scheme) || "https".equals(scheme) || "mailto".equals(scheme)
                || "tel".equals(scheme) || "sms".equals(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException e) {
                Toast.makeText(this, "No app is available to open this link.", Toast.LENGTH_SHORT).show();
            }
            return true;
        }
        return true;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void finishFileChooser(Uri[] results) {
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            finishFileChooser(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        finishFileChooser(null);
        if (webView != null) {
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
