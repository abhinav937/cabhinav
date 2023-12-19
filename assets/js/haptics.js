// Function to trigger sharp haptic feedback
function triggerSharpHapticFeedback() {
    // Check if the "vibrate" API is available in the browser
    if ('vibrate' in navigator) {
      navigator.vibrate([8]); // Trigger the sharp haptic feedback
    } else {
      // Haptic feedback is not supported
      console.log('Haptic feedback is not supported in this browser.');
    }
  }

  // Function to trigger sharp haptic feedback
  function triggerlightHapticFeedback() {
    // Check if the "vibrate" API is available in the browser
    if ('vibrate' in navigator) {
      navigator.vibrate([4]); // Trigger the sharp haptic feedback
    } else {
      // Haptic feedback is not supported
      console.log('Haptic feedback is not supported in this browser.');
    }
  }

  // Function to trigger button press haptic feedback
  function triggerButtonHapticFeedback() {
    // Check if the "vibrate" API is available in the browser
    if ('vibrate' in navigator) {
      navigator.vibrate([5, 450, 5]); // Trigger the button press haptic feedback
    } else {
      // Haptic feedback is not supported
      console.log('Haptic feedback is not supported in this browser.');
    }
  }