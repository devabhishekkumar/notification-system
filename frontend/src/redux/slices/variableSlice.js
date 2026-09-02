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
   * Django validation errors can look like:
   *
   * {
   *   "variable_name": ["This field is required."]
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
   NORMALIZE VARIABLE
============================================================ */

const normalizeVariable = (variable) => {
  if (!variable) {
    return variable;
  }

  return {
    ...variable,

    /*
     * Backend fields
     */
    variable_name:
      variable.variable_name ||
      variable.name ||
      "",

    variable_value:
      variable.variable_value ??
      variable.default_value ??
      "",

    /*
     * Keep these aliases so existing UI
     * components continue working.
     */
    name:
      variable.variable_name ||
      variable.name ||
      "",

    default_value:
      variable.variable_value ??
      variable.default_value ??
      "",

    description:
      variable.description || "",
  };
};


/* ============================================================
   FETCH VARIABLES

   GET
   /notifications/templates/:templateId/variables/
============================================================ */

export const fetchVariables =
  createAsyncThunk(
    "variables/fetchVariables",

    async (
      templateId,
      { rejectWithValue }
    ) => {
      try {
        if (!templateId) {
          return rejectWithValue(
            "Template ID is required."
          );
        }

        const response =
          await api.get(
            `/notifications/templates/${templateId}/variables/`
          );

        const data =
          response.data;

        let variables = [];

        if (Array.isArray(data)) {
          variables = data;
        } else if (
          Array.isArray(data?.results)
        ) {
          variables = data.results;
        } else if (
          Array.isArray(data?.data)
        ) {
          variables = data.data;
        }

        return variables.map(
          normalizeVariable
        );
      } catch (error) {
        return rejectWithValue(
          getApiError(
            error,
            "Failed to load variables."
          )
        );
      }
    }
  );


/* ============================================================
   CREATE VARIABLE

   POST
   /notifications/templates/:templateId/variables/
============================================================ */

export const createVariable =
  createAsyncThunk(
    "variables/createVariable",

    async (
      {
        templateId,
        data,
      },
      { rejectWithValue }
    ) => {
      try {
        if (!templateId) {
          return rejectWithValue(
            "Template ID is required."
          );
        }

        if (!data?.variable_name?.trim()) {
          return rejectWithValue(
            "Variable name is required."
          );
        }

        const payload = {
          variable_name:
            data.variable_name.trim(),

          variable_value:
            data.variable_value ??
            "",

          ...(data.description !== undefined
            ? {
                description:
                  data.description,
              }
            : {}),
        };

        const response =
          await api.post(
            `/notifications/templates/${templateId}/variables/`,
            payload
          );

        return normalizeVariable(
          response.data
        );
      } catch (error) {
        return rejectWithValue(
          getApiError(
            error,
            "Failed to create variable."
          )
        );
      }
    }
  );


/* ============================================================
   UPDATE VARIABLE

   PATCH
   /notifications/variables/:id/
============================================================ */

export const updateVariable =
  createAsyncThunk(
    "variables/updateVariable",

    async (
      {
        id,
        data,
      },
      { rejectWithValue }
    ) => {
      try {
        if (!id) {
          return rejectWithValue(
            "Variable ID is required."
          );
        }

        if (
          !data?.variable_name?.trim()
        ) {
          return rejectWithValue(
            "Variable name is required."
          );
        }

        const payload = {
          variable_name:
            data.variable_name.trim(),

          variable_value:
            data.variable_value ??
            "",

          ...(data.description !== undefined
            ? {
                description:
                  data.description,
              }
            : {}),
        };

        const response =
          await api.patch(
            `/notifications/variables/${id}/`,
            payload
          );

        return normalizeVariable(
          response.data
        );
      } catch (error) {
        return rejectWithValue(
          getApiError(
            error,
            "Failed to update variable."
          )
        );
      }
    }
  );


/* ============================================================
   DELETE VARIABLE

   DELETE
   /notifications/variables/:id/
============================================================ */

export const deleteVariable =
  createAsyncThunk(
    "variables/deleteVariable",

    async (
      id,
      { rejectWithValue }
    ) => {
      try {
        if (!id) {
          return rejectWithValue(
            "Variable ID is required."
          );
        }

        await api.delete(
          `/notifications/variables/${id}/`
        );

        return id;
      } catch (error) {
        return rejectWithValue(
          getApiError(
            error,
            "Failed to delete variable."
          )
        );
      }
    }
  );


/* ============================================================
   SLICE
============================================================ */

const variableSlice =
  createSlice({
    name: "variables",

    initialState,

    reducers: {

      /* --------------------------------------------------------
         SET VARIABLES
      -------------------------------------------------------- */

      setVariables: (
        state,
        action
      ) => {
        state.items =
          Array.isArray(
            action.payload
          )
            ? action.payload.map(
                normalizeVariable
              )
            : [];

        state.error = null;
      },


      /* --------------------------------------------------------
         CLEAR ERROR
      -------------------------------------------------------- */

      clearVariableError: (
        state
      ) => {
        state.error = null;
      },


      /* --------------------------------------------------------
         CLEAR VARIABLES
      -------------------------------------------------------- */

      clearVariables: (
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
            fetchVariables.pending,
            (state) => {
              state.loading = true;
              state.error = null;
            }
          )

          .addCase(
            fetchVariables.fulfilled,
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
            fetchVariables.rejected,
            (
              state,
              action
            ) => {
              state.loading = false;

              state.error =
                action.payload ||
                "Failed to load variables.";
            }
          )


          /* ==================================================
             CREATE
          ================================================== */

          .addCase(
            createVariable.pending,
            (state) => {
              state.creating = true;
              state.error = null;
            }
          )

          .addCase(
            createVariable.fulfilled,
            (
              state,
              action
            ) => {
              state.creating = false;

              if (
                action.payload
              ) {
                state.items.push(
                  action.payload
                );
              }

              state.error = null;
            }
          )

          .addCase(
            createVariable.rejected,
            (
              state,
              action
            ) => {
              state.creating = false;

              state.error =
                action.payload ||
                "Failed to create variable.";
            }
          )


          /* ==================================================
             UPDATE
          ================================================== */

          .addCase(
            updateVariable.pending,
            (state) => {
              state.updating = true;
              state.error = null;
            }
          )

          .addCase(
            updateVariable.fulfilled,
            (
              state,
              action
            ) => {
              state.updating = false;

              const updated =
                action.payload;

              if (!updated?.id) {
                state.error = null;
                return;
              }

              const index =
                state.items.findIndex(
                  (item) =>
                    String(item.id) ===
                    String(updated.id)
                );

              if (index !== -1) {
                state.items[index] =
                  updated;
              } else {
                state.items.push(
                  updated
                );
              }

              state.error = null;
            }
          )

          .addCase(
            updateVariable.rejected,
            (
              state,
              action
            ) => {
              state.updating = false;

              state.error =
                action.payload ||
                "Failed to update variable.";
            }
          )


          /* ==================================================
             DELETE
          ================================================== */

          .addCase(
            deleteVariable.pending,
            (state) => {
              state.deleting = true;
              state.error = null;
            }
          )

          .addCase(
            deleteVariable.fulfilled,
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
            deleteVariable.rejected,
            (
              state,
              action
            ) => {
              state.deleting = false;

              state.error =
                action.payload ||
                "Failed to delete variable.";
            }
          );
      },
  });


/* ============================================================
   ACTIONS
============================================================ */

export const {
  setVariables,
  clearVariableError,
  clearVariables,
} =
  variableSlice.actions;


/* ============================================================
   SELECTORS
============================================================ */

export const selectVariables =
  (state) =>
    state.variables?.items || [];

export const selectVariablesLoading =
  (state) =>
    state.variables?.loading || false;

export const selectVariablesCreating =
  (state) =>
    state.variables?.creating || false;

export const selectVariablesUpdating =
  (state) =>
    state.variables?.updating || false;

export const selectVariablesDeleting =
  (state) =>
    state.variables?.deleting || false;

export const selectVariablesError =
  (state) =>
    state.variables?.error || null;


/* ============================================================
   REDUCER
============================================================ */

export default variableSlice.reducer;