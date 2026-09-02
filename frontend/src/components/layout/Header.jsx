import {
  Bell,
  UserCircle,
  LogOut,
  ChevronDown,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  useNavigate,
} from "react-router-dom";

import {
  logout,
} from "../../redux/slices/authSlice";

import {
  fetchLogs,
  selectLogs,
  selectLogsLoading,
} from "../../redux/slices/logSlice";

/* ============================================================
   HEADER
============================================================ */

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* ==========================================================
     REDUX
  ========================================================== */

  const logs = useSelector(selectLogs);

  const isLoadingNotifications =
    useSelector(selectLogsLoading);

  /* ==========================================================
     REFS
  ========================================================== */

  const notificationRef =
    useRef(null);

  const userMenuRef =
    useRef(null);

  /* ==========================================================
     STATE
  ========================================================== */

  const [
    showUserMenu,
    setShowUserMenu,
  ] = useState(false);

  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);

  /* ==========================================================
     LOAD NOTIFICATIONS
  ========================================================== */

  const loadNotifications = () => {
    const accessToken =
      localStorage.getItem(
        "access_token"
      );

    if (!accessToken) {
      setNotifications([]);
      return;
    }

    dispatch(fetchLogs());
  };

  /* ==========================================================
     NOTIFICATION TITLE
  ========================================================== */

  const getNotificationTitle = (
    notification
  ) => {
    const channel =
      notification?.channel ||
      "Notification";

    const body =
      notification?.body || "";

    const subject =
      notification?.subject || "";

    if (subject) {
      return subject;
    }

    if (
      body
        .toLowerCase()
        .includes(
          "successfully logged in"
        ) ||
      body
        .toLowerCase()
        .includes("welcome back") ||
      body
        .toLowerCase()
        .includes("login")
    ) {
      return "Login Successful";
    }

    if (
      body
        .toLowerCase()
        .includes("goodbye") ||
      body
        .toLowerCase()
        .includes("logged out") ||
      body
        .toLowerCase()
        .includes("logout")
    ) {
      return "Logout Successful";
    }

    return `${channel} Notification`;
  };

  /* ==========================================================
     NOTIFICATION MESSAGE
  ========================================================== */

  const getNotificationMessage = (
    notification
  ) => {
    const body =
      notification?.body || "";

    if (body) {
      return body;
    }

    const channel =
      notification?.channel ||
      "Notification";

    return `${channel} notification sent successfully.`;
  };

  /* ==========================================================
     FORMAT TIME
  ========================================================== */

  const formatTime = (value) => {
    if (!value) {
      return "Just now";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Just now";
    }

    const now = new Date();

    const difference =
      now.getTime() -
      date.getTime();

    const seconds = Math.floor(
      difference / 1000
    );

    const minutes = Math.floor(
      seconds / 60
    );

    const hours = Math.floor(
      minutes / 60
    );

    const days = Math.floor(
      hours / 24
    );

    if (seconds < 60) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    if (days < 7) {
      return `${days} day${
        days > 1 ? "s" : ""
      } ago`;
    }

    return date.toLocaleDateString(
      [],
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* ==========================================================
     CONVERT REDUX LOGS → HEADER NOTIFICATIONS
  ========================================================== */

  useEffect(() => {
    const formattedNotifications =
      (Array.isArray(logs)
        ? logs
        : []
      )
        .filter(
          (log) =>
            log?.status === "SENT"
        )
        .map((log) => ({
          id: log.id,

          title:
            getNotificationTitle(log),

          message:
            getNotificationMessage(log),

          channel:
            log.channel,

          status:
            log.status,

          time:
            log.created_at ||
            log.sent_at,

          providerMessageId:
            log.provider_message_id ||
            "",
        }));

    setNotifications(
      formattedNotifications
    );
  }, [logs]);

  /* ==========================================================
     LOAD NOTIFICATIONS ON START
  ========================================================== */

  useEffect(() => {
    loadNotifications();

    const interval =
      setInterval(() => {
        loadNotifications();
      }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* ==========================================================
     CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  ========================================================== */

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      const target =
        event.target;

      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          target
        )
      ) {
        setShowNotifications(
          false
        );
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(
          target
        )
      ) {
        setShowUserMenu(false);
      }
    };

    const handleEscape = (
      event
    ) => {
      if (event.key === "Escape") {
        setShowNotifications(
          false
        );

        setShowUserMenu(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /* ==========================================================
     BROWSER NOTIFICATION PERMISSION
  ========================================================== */

  const enableBrowserNotifications =
    async () => {
      if (
        !("Notification" in window)
      ) {
        return;
      }

      if (
        Notification.permission ===
        "default"
      ) {
        try {
          await Notification.requestPermission();
        } catch (error) {
          console.error(
            "Notification permission error:",
            error
          );
        }
      }
    };

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      /*
        API call is now handled
        inside authSlice.
      */

      await dispatch(
        logout()
      ).unwrap();

    } catch (error) {
      /*
        Local authentication is
        cleared by authSlice even
        if notification API fails.
      */

      console.error(
        "Logout notification error:",
        error
      );
    } finally {
      setNotifications([]);

      localStorage.removeItem(
        "show_login_notification"
      );

      navigate("/login", {
        replace: true,
      });

      setIsLoggingOut(false);
    }
  };

  /* ==========================================================
     CLOSE BOTH MENUS
  ========================================================== */

  const closeMenus = () => {
    setShowUserMenu(false);
    setShowNotifications(false);
  };

  /* ==========================================================
     RETURN
  ========================================================== */

  return (
    <header
      className="
        sticky top-0 z-30
        flex h-20
        items-center justify-between
        border-b border-slate-200
        bg-white
        px-5 sm:px-6 lg:px-10
      "
    >
      {/* ======================================================
          LEFT
      ====================================================== */}

      <div>
        <p
          className="
            text-sm
            font-semibold
            uppercase
            tracking-wider
            text-slate-500
          "
        >
          Admin Panel
        </p>
      </div>

      {/* ======================================================
          RIGHT
      ====================================================== */}

      <div
        className="
          flex
          items-center
          gap-3
          sm:gap-5
        "
      >
        {/* ====================================================
            NOTIFICATION
        ==================================================== */}

        <div
          ref={notificationRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() => {
              setShowNotifications(
                (previous) =>
                  !previous
              );

              setShowUserMenu(false);

              enableBrowserNotifications();

              loadNotifications();
            }}
            className="
              relative
              rounded-xl
              p-3
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-700
            "
            aria-label="Notifications"
          >
            <Bell size={21} />

            {notifications.length > 0 && (
              <span
                className="
                  absolute
                  right-1
                  top-1
                  flex
                  h-4
                  min-w-4
                  items-center
                  justify-center
                  rounded-full
                  bg-blue-600
                  px-1
                  text-[9px]
                  font-bold
                  text-white
                "
              >
                {notifications.length >
                99
                  ? "99+"
                  : notifications.length}
              </span>
            )}
          </button>

          {/* ==================================================
              NOTIFICATION DROPDOWN
          ================================================== */}

          {showNotifications && (
            <div
              className="
                absolute
                right-0
                top-14
                z-50
                w-96
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                bg-white
                shadow-xl
              "
            >
              {/* Header */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-slate-100
                  px-4
                  py-3
                "
              >
                <div>
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    Notifications
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-slate-400
                    "
                  >
                    Recent notification activity
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    loadNotifications
                  }
                  disabled={
                    isLoadingNotifications
                  }
                  className="
                    rounded-lg
                    p-2
                    text-slate-400
                    transition
                    hover:bg-slate-100
                    hover:text-slate-600
                    disabled:opacity-50
                  "
                  aria-label="Refresh notifications"
                >
                  <RefreshCw
                    size={16}
                    className={
                      isLoadingNotifications
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>
              </div>

              {/* Loading */}

              {isLoadingNotifications &&
              notifications.length ===
                0 ? (
                <div
                  className="
                    px-4
                    py-10
                    text-center
                  "
                >
                  <RefreshCw
                    size={28}
                    className="
                      mx-auto
                      mb-2
                      animate-spin
                      text-slate-300
                    "
                  />

                  <p
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    Loading notifications...
                  </p>
                </div>
              ) : notifications.length ===
                0 ? (
                /* Empty */

                <div
                  className="
                    px-4
                    py-10
                    text-center
                  "
                >
                  <Bell
                    size={32}
                    className="
                      mx-auto
                      mb-2
                      text-slate-300
                    "
                  />

                  <p
                    className="
                      text-sm
                      font-medium
                      text-slate-500
                    "
                  >
                    No notifications
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-400
                    "
                  >
                    Your recent activity will appear here.
                  </p>
                </div>
              ) : (
                /* Notification List */

                <div
                  className="
                    max-h-96
                    overflow-y-auto
                  "
                >
                  {notifications.map(
                    (notification) => (
                      <div
                        key={
                          notification.id
                        }
                        className="
                          flex
                          gap-3
                          border-b
                          border-slate-100
                          px-4
                          py-3
                          transition
                          hover:bg-slate-50
                        "
                      >
                        {/* Status icon */}

                        <div
                          className="
                            mt-0.5
                            shrink-0
                            rounded-full
                            bg-green-50
                            p-1.5
                          "
                        >
                          <CheckCircle
                            size={16}
                            className="
                              text-green-600
                            "
                          />
                        </div>

                        {/* Content */}

                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          <div
                            className="
                              flex
                              items-start
                              justify-between
                              gap-2
                            "
                          >
                            <p
                              className="
                                text-sm
                                font-semibold
                                text-slate-700
                              "
                            >
                              {
                                notification.title
                              }
                            </p>

                            <span
                              className="
                                shrink-0
                                rounded-full
                                bg-slate-100
                                px-2
                                py-0.5
                                text-[9px]
                                font-medium
                                text-slate-500
                              "
                            >
                              {
                                notification.channel
                              }
                            </span>
                          </div>

                          <p
                            className="
                              mt-1
                              text-xs
                              leading-5
                              text-slate-500
                            "
                          >
                            {
                              notification.message
                            }
                          </p>

                          <p
                            className="
                              mt-1
                              text-[10px]
                              text-slate-400
                            "
                          >
                            {formatTime(
                              notification.time
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ====================================================
            DIVIDER
        ==================================================== */}

        <div
          className="
            hidden
            h-8
            w-px
            bg-slate-200
            sm:block
          "
        />

        {/* ====================================================
            USER MENU
        ==================================================== */}

        <div
          ref={userMenuRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(
                (previous) =>
                  !previous
              );

              setShowNotifications(false);
            }}
            className="
              flex
              items-center
              gap-3
              rounded-xl
              p-1.5
              transition
              hover:bg-slate-50
            "
          >
            <UserCircle
              size={40}
              className="text-slate-400"
            />

            <div
              className="
                hidden
                text-right
                sm:block
              "
            >
              <p
                className="
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Admin
              </p>

              <p
                className="
                  text-xs
                  text-slate-400
                "
              >
                Administrator
              </p>
            </div>

            <ChevronDown
              size={16}
              className="
                hidden
                text-slate-400
                sm:block
              "
            />
          </button>

          {/* ==================================================
              USER DROPDOWN
          ================================================== */}

          {showUserMenu && (
            <div
              className="
                absolute
                right-0
                top-14
                z-50
                w-52
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                bg-white
                shadow-xl
              "
            >
              <div
                className="
                  border-b
                  border-slate-100
                  px-4
                  py-3
                "
              >
                <p
                  className="
                    text-sm
                    font-semibold
                    text-slate-700
                  "
                >
                  Admin
                </p>

                <p
                  className="
                    text-xs
                    text-slate-400
                  "
                >
                  Administrator
                </p>
              </div>

              {/* Logout */}

              <button
                type="button"
                onClick={() => {
                  closeMenus();
                  handleLogout();
                }}
                disabled={isLoggingOut}
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                  text-red-500
                  transition
                  hover:bg-red-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <LogOut size={18} />

                {isLoggingOut
                  ? "Logging out..."
                  : "Logout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;