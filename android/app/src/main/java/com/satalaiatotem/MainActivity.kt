package com.satalaiatotem

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.view.View
import android.text.InputType
import android.view.MotionEvent
import android.widget.EditText
import android.widget.Toast
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.os.Handler
import android.os.Looper
import android.content.Intent
import androidx.appcompat.app.AlertDialog

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  private var isInKioskMode = true
  private val handler = Handler(Looper.getMainLooper())
  override fun getMainComponentName(): String = "SaTalaiaTotem"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
      super.onCreate(savedInstanceState)

      if (isDeviceOwner()) {
          startKioskMode()
      } else {
          Toast.makeText(this, "Device Owner Mode Required", Toast.LENGTH_LONG).show()
      }

      setImmersiveMode()
      startKioskMonitor()
  }

// Check if the app is the Device Owner
    private fun isDeviceOwner(): Boolean {
        val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val componentName = ComponentName(this, MyDeviceAdminReceiver::class.java)
        return devicePolicyManager.isDeviceOwnerApp(packageName)
    }

    // Start Lock Task Mode (Kiosk Mode)
    private fun startKioskMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            startLockTask()
            isInKioskMode = true
            Toast.makeText(this, "Kiosk Mode Started", Toast.LENGTH_SHORT).show()
        }
    }

    private fun stopKioskMode() {
        stopLockTask()
        isInKioskMode = false
    }

    // Ensure Immersive Mode (Fullscreen, No System Navigation)
    private fun setImmersiveMode() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
            View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )
    }

    private fun startKioskMonitor() {
        handler.post(object : Runnable {
            override fun run() {
                if (!isInKioskMode) {
                    showExitDialog()
                }
                handler.postDelayed(this, 1000) // Check every second
            }
        })
    }

    private fun showExitDialog() {
      val passwordInput = EditText(this)
      passwordInput.hint = "Enter Password"

      val alertDialog = AlertDialog.Builder(this)
          .setTitle("Exit Kiosk Mode")
          .setMessage("Please enter the password to exit.")
          .setView(passwordInput)
          .setPositiveButton("Unlock") { dialogInterface, _ ->
              val enteredPassword = passwordInput.text.toString()
              if (enteredPassword == "1234") {
                  stopKioskMode()
                  Toast.makeText(this, "Unlocked", Toast.LENGTH_SHORT).show()
              } else {
                  Toast.makeText(this, "Incorrect Password!", Toast.LENGTH_SHORT).show()
                  startKioskMode()
              }
          }
          .setNegativeButton("Cancel") { dialogInterface, _ ->
              startKioskMode()
              dialogInterface.dismiss()
          }
          .setCancelable(false)
          .create()

      alertDialog.show()
    }


    override fun onUserLeaveHint() {
        // Prevent user from leaving the app
        showExitDialog()
    }

    override fun onPause() {
        super.onPause()
        moveTaskToBack(true) // Prevents users from switching apps
    }

    override fun onStop() {
        super.onStop()
        val restartIntent = Intent(applicationContext, MainActivity::class.java)
        restartIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        applicationContext.startActivity(restartIntent)
    }
}
