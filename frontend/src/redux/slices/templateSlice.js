import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import api from "../../services/api";


/* ============================================================
   INITIAL STATE
============================================================ */

const initialState = {
  items: [],

  loading: false,
  creating: false,
  updating: false,
  deleting: false,

  error: null,
};


/* ============================================================
   ERROR HELPER
============================================================ */

const getApiError = (
  error,
  fallback = "Something went wrong."
) => {
  const data = error?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data?.detail) {
    return data.detail;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.error) {
    return data.error;
  }

  /*
   * Django validation response:
   *
   * {
   *   "body": ["This field is required."]
   * }
   */
  if (data && typeof data === "object") {
    const firstError = Object.values(data)
      .flat()
      .find(
        (value) =>
          typeof value === "string"
      );

    if (firstError) {
      return firstError;
    }
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};


/* ============================================================
   FETCH TEMPLATES

   GET
   /notifications/templates/
============================================================ */

export const fetchTemplates =
  createAsyncThunk(
    "templates/fetchTemplates",

    async (
      _,
      { rejectWithValue }
    ) => {
      try {
        const response =
          await api.get(
            "/notifications/templates/"
          );

        const data =
          response.data;

        /*
         * Supports:
         *
         * [
         *   {...},
         *   {...}
         * ]
         *
         * DRF:
         *
         * {
         *   results: [...]
         * }
         */

        if (Array.isArray(data)) {
          return data;
        }

        if (
          Array.isArray(
            data?.results
          )
        ) {
          return data.results;
        }

        if (
          Array.isArray(
            data?.data
          )
        ) {
          return data.data;
        }

        return [];
      } catch (error) {
        return rejectWithValue(
          getApiError(
            error,
            "Failed to load templates."
          )
        );
      }
    }
  );


/* ============================================================
   CREATE TEMPLATE

   POST
   /notifications/templates/
============================================================ */

export const createTemplate =
  createAsyncThunk(
    "templates/createTemplate",

    async (
      template,
      { rejectWithValue }
    ) => {
      try {
        if (!template) {
          return rejectWithValue(
            "Template data is required."
          );
        }

        const response =
          await api.post(
            "/notifications/templates/",
            template
          );

        return response.data;
      } catch (error) {
        return rejectWithValue(
          getApiError(
            error,
            "Failed to create template."
          )
        );
      }
    }
  );


/* ============================================================
   UPDATE TEMPLATE

   PATCH
   /notifications/templates/:id/
============================================================ */

export const updateTemplate =
  createAsyncThunk(
    "templates/updateTemplate",

    async (
      { id, data },
      { rejectWithValue }
    ) => {
      try {
        if (!id) {
          return rejectWithValue(
            "Template ID is required."
          );
        }

        if (!data) {
          return rejectWithValue(
            "Template data is required."
          );
        }

        const response =
          await api.patch(
            `/notifications/templates/${id}/`,
            data
          );

        return response.data;
      } catch (error) {
        return rejectWithValue(
          getApiError(
            error,
            "Failed to update template."
          )
        );
      }
    }
  );


/* ============================================================
   DELETE TEMPLATE

   DELETE
   /notifications/templates/:id/
============================================================ */

export const deleteTemplate =
  createAsyncThunk(
    "templates/deleteTemplate",

    async (
      id,
      { rejectWithValue }
    ) => {
      try {
        if (!id) {
          return rejectWithValue(
            "Template ID is required."
          );
        }

        await api.delete(
          `/notifications/templates/${id}/`
        );

        return id;
      } catch (error) {
        return rejectWithValue(
          getApiError(
            error,
            "Failed to delete template."
          )
        );
      }
    }
  );


/* ============================================================
   SLICE
============================================================ */

const templateSlice =
  createSlice({
    name: "templates",

    initialState,

    reducers: {

      /* --------------------------------------------------------
         CLEAR ERROR
      -------------------------------------------------------- */

      clearTemplateError: (
        state
      ) => {
        state.error = null;
      },


      /* --------------------------------------------------------
         CLEAR TEMPLATES
      -------------------------------------------------------- */

      clearTemplates: (
        state
      ) => {
        state.items = [];
        state.error = null;
      },

    },


    /* ==========================================================
       ASYNC ACTIONS
    ========================================================== */

    extraReducers:
      (builder) => {

        builder

          /* ==================================================
             FETCH
          ================================================== */

          .addCase(
            fetchTemplates.pending,
            (state) => {
              state.loading = true;
              state.error = null;
            }
          )

          .addCase(
            fetchTemplates.fulfilled,
            (
              state,
              action
            ) => {
              state.loading = false;

              state.items =
                Array.isArray(
                  action.payload
                )
                  ? action.payload
                  : [];

              state.error = null;
            }
          )

          .addCase(
            fetchTemplates.rejected,
            (
              state,
              action
            ) => {
              state.loading = false;

              state.error =
                action.payload ||
                "Failed to load templates.";
            }
          )


          /* ==================================================
             CREATE
          ================================================== */

          .addCase(
            createTemplate.pending,
            (state) => {
              state.creating = true;
              state.error = null;
            }
          )

          .addCase(
            createTemplate.fulfilled,
            (
              state,
              action
            ) => {
              state.creating = false;

              if (
                action.payload
              ) {
                state.items.unshift(
                  action.payload
                );
              }

              state.error = null;
            }
          )

          .addCase(
            createTemplate.rejected,
            (
              state,
              action
            ) => {
              state.creating = false;

              state.error =
                action.payload ||
                "Failed to create template.";
            }
          )


          /* ==================================================
             UPDATE
          ================================================== */

          .addCase(
            updateTemplate.pending,
            (state) => {
              state.updating = true;
              state.error = null;
            }
          )

          .addCase(
            updateTemplate.fulfilled,
            (
              state,
              action
            ) => {
              state.updating = false;

              const updatedTemplate =
                action.payload;

              if (!updatedTemplate?.id) {
                state.error = null;
                return;
              }

              const index =
                state.items.findIndex(
                  (item) =>
                    String(item.id) ===
                    String(
                      updatedTemplate.id
                    )
                );

              if (index !== -1) {
                state.items[index] =
                  updatedTemplate;
              } else {
                state.items.unshift(
                  updatedTemplate
                );
              }

              state.error = null;
            }
          )

          .addCase(
            updateTemplate.rejected,
            (
              state,
              action
            ) => {
              state.updating = false;

              state.error =
                action.payload ||
                "Failed to update template.";
            }
          )


          /* ==================================================
             DELETE
          ================================================== */

          .addCase(
            deleteTemplate.pending,
            (state) => {
              state.deleting = true;
              state.error = null;
            }
          )

          .addCase(
            deleteTemplate.fulfilled,
            (
              state,
              action
            ) => {
              state.deleting = false;

              state.items =
                state.items.filter(
                  (item) =>
                    String(item.id) !==
                    String(
                      action.payload
                    )
                );

              state.error = null;
            }
          )

          .addCase(
            deleteTemplate.rejected,
            (
              state,
              action
            ) => {
              state.deleting = false;

              state.error =
                action.payload ||
                "Failed to delete template.";
            }
          );
      },
  });


/* ============================================================
   ACTIONS
============================================================ */

export const {
  clearTemplateError,
  clearTemplates,
} =
  templateSlice.actions;


/* ============================================================
   SELECTORS
============================================================ */

/*
 * Main templates list
 */
export const selectTemplates =
  (state) =>
    state.templates?.items || [];


/*
 * Loading templates
 */
export const selectTemplatesLoading =
  (state) =>
    state.templates?.loading || false;


/*
 * Creating template
 */
export const selectTemplatesCreating =
  (state) =>
    state.templates?.creating || false;


/*
 * Updating template
 */
export const selectTemplatesUpdating =
  (state) =>
    state.templates?.updating || false;


/*
 * Deleting template
 */
export const selectTemplatesDeleting =
  (state) =>
    state.templates?.deleting || false;


/*
 * Template error
 */
export const selectTemplatesError =
  (state) =>
    state.templates?.error || null;


/* ============================================================
   BACKWARD COMPATIBILITY
============================================================ */

/*
 * These aliases prevent errors if another component
 * still uses the old singular selector names.
 */

export const selectTemplateLoading =
  selectTemplatesLoading;

export const selectTemplateCreating =
  selectTemplatesCreating;

export const selectTemplateUpdating =
  selectTemplatesUpdating;

export const selectTemplateDeleting =
  selectTemplatesDeleting;

export const selectTemplateError =
  selectTemplatesError;


/* ============================================================
   REDUCER
============================================================ */

export default templateSlice.reducer;