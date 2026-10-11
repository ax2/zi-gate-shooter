package com.ax2.zigateshooter;

import static org.junit.Assert.*;

import android.os.SystemClock;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.webkit.WebView;
import androidx.lifecycle.Lifecycle;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Exercises the packaged WebView and Capacitor callbacks, without mutating game state. */
@RunWith(AndroidJUnit4.class)
public class NativeFlowTest {
    private String read(ActivityScenario<MainActivity> scenario, String expression) throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        scenario.onActivity(activity -> activity.getBridge().getWebView().evaluateJavascript(
            expression, value -> { result.set(value); done.countDown(); }));
        assertTrue("WebView read timed out", done.await(5, TimeUnit.SECONDS));
        return result.get();
    }

    private JSONObject state(ActivityScenario<MainActivity> scenario) throws Exception {
        return new JSONObject(read(scenario,
            "typeof window.__gateDiagnostics === 'function' ? window.__gateDiagnostics() : {}"));
    }

    private JSONObject awaitMode(ActivityScenario<MainActivity> scenario, String mode) throws Exception {
        long deadline = SystemClock.uptimeMillis() + 15000;
        JSONObject last;
        do {
            last = state(scenario);
            if (mode.equals(last.optString("mode"))) return last;
            SystemClock.sleep(100);
        } while (SystemClock.uptimeMillis() < deadline);
        fail("Expected " + mode + ", got " + last);
        return last;
    }

    private void tap(ActivityScenario<MainActivity> scenario, double logicalY) throws Exception {
        JSONObject point = new JSONObject(read(scenario,
            "(() => { const r=document.querySelector('canvas').getBoundingClientRect();" +
            "const s=Math.min(r.width/720,r.height/1280);return {" +
            "x:r.left+r.width/2,y:r.top+(r.height-1280*s)/2+" + logicalY + "*s," +
            "width:innerWidth,height:innerHeight};})()"));
        float[] screen = new float[2];
        scenario.onActivity(activity -> {
            WebView view = activity.getBridge().getWebView();
            int[] location = new int[2];
            view.getLocationOnScreen(location);
            screen[0] = location[0] + (float)(point.optDouble("x") * view.getWidth() / point.optDouble("width"));
            screen[1] = location[1] + (float)(point.optDouble("y") * view.getHeight() / point.optDouble("height"));
        });
        long time = SystemClock.uptimeMillis();
        MotionEvent down = MotionEvent.obtain(time, time, MotionEvent.ACTION_DOWN, screen[0], screen[1], 0);
        MotionEvent up = MotionEvent.obtain(time, time + 60, MotionEvent.ACTION_UP, screen[0], screen[1], 0);
        try {
            InstrumentationRegistry.getInstrumentation().sendPointerSync(down);
            InstrumentationRegistry.getInstrumentation().sendPointerSync(up);
        } finally { down.recycle(); up.recycle(); }
    }

    private void back() {
        InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);
    }

    private void sameRun(JSONObject before, JSONObject after) throws Exception {
        assertEquals(before.getDouble("time"), after.getDouble("time"), 0.000001);
        for (String key : new String[]{"score", "hp", "round", "bodies", "bullets"})
            assertEquals(key, before.getInt(key), after.getInt(key));
        assertEquals(before.getDouble("playerX"), after.getDouble("playerX"), 0.000001);
    }

    @Test public void packagedLaunchBackAndOfflineLicensePreserveRun() throws Exception {
        assertEquals("com.ax2.zigateshooter", InstrumentationRegistry.getInstrumentation()
            .getTargetContext().getPackageName());
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            awaitMode(scenario, "menu");
            assertTrue(read(scenario, "location.href").contains("localhost"));
            tap(scenario, 1041);
            awaitMode(scenario, "playing");
            SystemClock.sleep(500);
            back();
            JSONObject paused = awaitMode(scenario, "paused");
            assertTrue("Game must advance before pause", paused.getDouble("time") > 0);
            tap(scenario, 713);
            awaitMode(scenario, "settings");
            tap(scenario, 953);
            long deadline = SystemClock.uptimeMillis() + 5000;
            while (!"true".equals(read(scenario, "!!document.querySelector('dialog[open]')")) &&
                SystemClock.uptimeMillis() < deadline) SystemClock.sleep(100);
            assertEquals("true", read(scenario, "!!document.querySelector('dialog[open]')"));
            assertTrue(Integer.parseInt(read(scenario, "document.querySelector('dialog pre').textContent.length")) > 39000);
            back();
            SystemClock.sleep(300);
            assertEquals("false", read(scenario, "!!document.querySelector('dialog[open]')"));
            sameRun(paused, awaitMode(scenario, "settings"));
            back();
            sameRun(paused, awaitMode(scenario, "paused"));
            tap(scenario, 603);
            awaitMode(scenario, "playing");
            SystemClock.sleep(200);
            assertTrue(state(scenario).getDouble("time") > paused.getDouble("time"));
        }
    }

    @Test public void backgroundResumeRequiresManualContinue() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            awaitMode(scenario, "menu");
            tap(scenario, 1041);
            awaitMode(scenario, "playing");
            SystemClock.sleep(300);
            scenario.moveToState(Lifecycle.State.CREATED);
            SystemClock.sleep(300);
            scenario.moveToState(Lifecycle.State.RESUMED);
            JSONObject paused = awaitMode(scenario, "paused");
            SystemClock.sleep(400);
            sameRun(paused, state(scenario));
            tap(scenario, 603);
            awaitMode(scenario, "playing");
            SystemClock.sleep(200);
            assertTrue(state(scenario).getDouble("time") > paused.getDouble("time"));
        }
    }
}
