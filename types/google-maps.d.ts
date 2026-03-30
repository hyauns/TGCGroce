/// <reference types="@types/google.maps" />

// Extend Window interface to include the google property injected by the Google Maps script
interface Window {
  google: typeof google
}
