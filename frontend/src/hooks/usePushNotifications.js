import {
  useCallback,
  useState,
} from "react";

import {
  registerPushNotifications,
} from "../utils/pushNotifications";


export default function usePushNotifications() {

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [subscription, setSubscription] =
    useState(null);


  // ==========================================================
  // REGISTER PUSH NOTIFICATIONS
  // ==========================================================

  const register = useCallback(
    async (accessToken) => {

      // --------------------------------------------------------
      // Validate access token
      // --------------------------------------------------------

      if (!accessToken) {

        const message =
          "Access token is required.";

        setError(message);

        throw new Error(message);
      }


      // --------------------------------------------------------
      // Start loading
      // --------------------------------------------------------

      setLoading(true);
      setError(null);


      try {

        // ------------------------------------------------------
        // Register browser push subscription
        // ------------------------------------------------------

        const result =
          await registerPushNotifications(
            accessToken
          );


        console.log(
          "Push registration result:",
          result
        );


        // ------------------------------------------------------
        // Django response:
        //
        // {
        //   message: "...",
        //   subscription: {...}
        // }
        // ------------------------------------------------------

        const registeredSubscription =
          result?.subscription || result;


        // ------------------------------------------------------
        // Save subscription in local state
        // ------------------------------------------------------

        setSubscription(
          registeredSubscription
        );


        // ------------------------------------------------------
        // Return result to caller
        // ------------------------------------------------------

        return result;

      } catch (err) {

        // ------------------------------------------------------
        // Clear subscription when registration fails
        // ------------------------------------------------------

        setSubscription(null);


        const message =
          err instanceof Error
            ? err.message
            : "Failed to register push notifications.";


        console.error(
          "Push registration failed:",
          err
        );


        setError(message);


        throw err;

      } finally {

        // ------------------------------------------------------
        // Stop loading
        // ------------------------------------------------------

        setLoading(false);
      }
    },
    []
  );


  // ==========================================================
  // CLEAR ERROR
  // ==========================================================

  const clearError = useCallback(
    () => {
      setError(null);
    },
    []
  );


  // ==========================================================
  // CLEAR SUBSCRIPTION
  // ==========================================================

  const clearSubscription = useCallback(
    () => {
      setSubscription(null);
    },
    []
  );


  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    register,
    subscription,
    loading,
    error,
    clearError,
    clearSubscription,
  };
}