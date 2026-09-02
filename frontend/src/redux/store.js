import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import triggerReducer from "./slices/triggerSlice";
import templateReducer from "./slices/templateSlice";
import variableReducer from "./slices/variableSlice";
import logReducer from "./slices/logSlice";
import pushReducer from "./slices/pushSlice";
import testSendReducer from "./slices/testSendSlice";


/* ============================================================
   REDUX STORE
============================================================ */

const store = configureStore({
  reducer: {

    /* --------------------------------------------------------
       AUTH
    -------------------------------------------------------- */
    auth: authReducer,

    /* --------------------------------------------------------
       NOTIFICATION TRIGGERS
    -------------------------------------------------------- */
    triggers: triggerReducer,

    /* --------------------------------------------------------
       NOTIFICATION TEMPLATES
    -------------------------------------------------------- */
    templates: templateReducer,

    /* --------------------------------------------------------
       TEMPLATE VARIABLES
    -------------------------------------------------------- */
    variables: variableReducer,

    /* --------------------------------------------------------
       NOTIFICATION LOGS
    -------------------------------------------------------- */
    logs: logReducer,

    /* --------------------------------------------------------
       WEB PUSH
    -------------------------------------------------------- */
    push: pushReducer,

    /* --------------------------------------------------------
       TEST SEND
    -------------------------------------------------------- */
    testSend: testSendReducer,
  },

  /* ==========================================================
     DEVELOPMENT CONFIGURATION
  ========================================================== */

  devTools: import.meta.env.DEV,
});


/* ============================================================
   EXPORT
============================================================ */

export default store;