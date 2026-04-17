# Build Jagdoc APK — Step by Step

This gives you a real `.apk` where tapping any `.jagdoc` file on your phone
opens it directly in the Jagdoc Viewer.

---

## Prerequisites

Install these once:

| Tool | Download |
|------|----------|
| Android Studio | https://developer.android.com/studio |
| JDK 17+ | Comes with Android Studio |
| Node.js | Already installed |

---

## Step 1 — Install Capacitor

Open a terminal in `jagdoc-project/` and run:

```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
```

---

## Step 2 — Add the file-open intent filter

Open this file in any text editor:
```
android/app/src/main/AndroidManifest.xml
```

Find the `<activity>` block and add the intent filter inside it:

```xml
<activity
    android:name=".MainActivity"
    ...>

    <!-- existing intent filters stay here -->

    <!-- ADD THIS BLOCK — opens .jagdoc files -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="file" android:mimeType="*/*"
              android:pathPattern=".*\\.jagdoc"
              android:host="*" />
    </intent-filter>
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="content" android:mimeType="*/*" />
    </intent-filter>

</activity>
```

---

## Step 3 — Add file reading to MainActivity

Open:
```
android/app/src/main/java/com/jagdoc/viewer/MainActivity.java
```

Replace the entire contents with:

```java
package com.jagdoc.viewer;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data == null) return;

        try {
            InputStream is = getContentResolver().openInputStream(data);
            BufferedReader reader = new BufferedReader(new InputStreamReader(is));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line).append("\n");
            reader.close();

            String content = sb.toString();
            String filename = data.getLastPathSegment();

            // Pass to web layer via JavaScript
            String js = "window.__openJagdoc && window.__openJagdoc("
                + jsString(content) + "," + jsString(filename) + ")";

            getBridge().getWebView().post(() ->
                getBridge().getWebView().evaluateJavascript(js, null)
            );
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String jsString(String s) {
        return "`" + s.replace("\\", "\\\\").replace("`", "\\`")
                      .replace("$", "\\$") + "`";
    }
}
```

---

## Step 4 — Hook the native call in viewer.html

Add this anywhere in the `<script>` section of `viewer.html`:

```js
// Called by Android when a .jagdoc file is tapped
window.__openJagdoc = function(content, filename) {
  try {
    pages = parse(content);
    if (!pages.length) return;
    cur = 0;
    document.getElementById('hfile').textContent = filename || 'file.jagdoc';
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('viewer').style.display = 'flex';
    requestAnimationFrame(() => { setMode(viewMode); });
  } catch(e) {}
};
```

---

## Step 5 — Build the APK

```bash
# Sync web files into Android project
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle to finish syncing (bottom status bar)
2. Menu → **Build → Build Bundle/APK → Build APK(s)**
3. Click **"locate"** when it finishes

APK is at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Step 6 — Install on your phone

**Option A — USB:**
```bash
# With USB debugging ON on your phone
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Option B — File transfer:**
1. Copy `app-debug.apk` to your phone (WhatsApp, Google Drive, USB cable)
2. Open the file on your phone
3. Tap **Install** (allow "unknown sources" if asked in Settings)

---

## After install

1. Open your file manager on the phone
2. Tap any `.jagdoc` file
3. Android will ask **"Open with..."** → select **Jagdoc Viewer**
4. Check **"Always"** to make it the default

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Gradle sync fails | File → Invalidate Caches → Restart |
| `adb` not found | Add Android SDK platform-tools to PATH |
| Install blocked | Settings → Security → Allow unknown sources |
| File doesn't trigger app | Some file managers use wrong MIME type — try a different file manager app |
