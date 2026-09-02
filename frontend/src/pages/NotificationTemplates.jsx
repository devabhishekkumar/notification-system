import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createTemplate,
  deleteTemplate,
  fetchTemplates,
  updateTemplate,
  selectTemplates,
  selectTemplatesLoading,
  selectTemplatesError,
} from "../redux/slices/templateSlice";

import {
  createVariable,
  updateVariable,
  deleteVariable,
} from "../redux/slices/variableSlice";

import {
  fetchTriggers,
  selectTriggers,
  selectTriggersLoading,
} from "../redux/slices/triggerSlice";

import TemplateModal from "../components/notifications/TemplateModal";


const CHANNELS = {
  WHATSAPP: "WHATSAPP",
  EMAIL: "EMAIL",
  WEB_PUSH: "WEB_PUSH",
};

const CHANNEL_LABELS = {
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  WEB_PUSH: "Web Push",
};


function getApiError(error) {
  if (!error) return "Something went wrong.";

  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.detail) {
    return error.detail;
  }

  return "Something went wrong.";
}


function normalizeVariables(variables = []) {
  return variables
    .map((variable) => ({
      id: variable.id,
      variable_name:
        variable.variable_name ||
        variable.name ||
        "",
      variable_value:
        variable.variable_value ??
        variable.default_value ??
        "",
    }))
    .filter((variable) => variable.variable_name.trim());
}


function NotificationTemplates() {
  const dispatch = useDispatch();

  const templates = useSelector(selectTemplates);
  const templatesLoading = useSelector(selectTemplatesLoading);
  const templatesError = useSelector(selectTemplatesError);

  const triggers = useSelector(selectTriggers);
  const triggersLoading = useSelector(selectTriggersLoading);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");

  const [actionError, setActionError] = useState("");

  useEffect(() => {
    dispatch(fetchTemplates());
    dispatch(fetchTriggers());
  }, [dispatch]);


  const triggerMap = useMemo(() => {
    const map = {};

    (triggers || []).forEach((trigger) => {
      map[trigger.id] = trigger;
    });

    return map;
  }, [triggers]);


  const getTriggerName = (triggerId) => {
    return (
      triggerMap[triggerId]?.name ||
      triggerMap[triggerId]?.event_key ||
      triggerId ||
      "Unknown Trigger"
    );
  };


  const filteredTemplates = useMemo(() => {
    const list = Array.isArray(templates) ? templates : [];

    return list.filter((template) => {
      const triggerName = getTriggerName(template.trigger).toLowerCase();

      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        triggerName.includes(searchText) ||
        String(template.channel || "")
          .toLowerCase()
          .includes(searchText) ||
        String(template.subject || "")
          .toLowerCase()
          .includes(searchText) ||
        String(template.title || "")
          .toLowerCase()
          .includes(searchText) ||
        String(template.body || "")
          .toLowerCase()
          .includes(searchText);

      const matchesChannel =
        channelFilter === "ALL" ||
        template.channel === channelFilter;

      return matchesSearch && matchesChannel;
    });
  }, [templates, search, channelFilter, triggerMap]);


  const openCreateModal = () => {
    setActionError("");
    setSelectedTemplate(null);
    setModalOpen(true);
  };


  const openEditModal = (template) => {
    setActionError("");
    setSelectedTemplate(template);
    setModalOpen(true);
  };


  const closeModal = () => {
    setModalOpen(false);
    setSelectedTemplate(null);
    setActionError("");
  };


  /*
   * CREATE TEMPLATE
   *
   * 1. Create notification template.
   * 2. Create all variables attached to it.
   */
  const handleCreate = async (data, variables = []) => {
    setActionError("");

    try {
      const createdTemplate = await dispatch(
        createTemplate(data)
      ).unwrap();

      const templateId = createdTemplate?.id;

      if (!templateId) {
        throw new Error(
          "Template was created but no template ID was returned."
        );
      }

      const cleanVariables = normalizeVariables(variables);

      for (const variable of cleanVariables) {
        await dispatch(
          createVariable({
            templateId,
            data: {
              variable_name: variable.variable_name,
              variable_value: variable.variable_value,
            },
          })
        ).unwrap();
      }

      await dispatch(fetchTemplates()).unwrap();

      closeModal();
    } catch (error) {
      console.error("Create template error:", error);

      const message = getApiError(error);

      setActionError(message);

      throw error;
    }
  };


  /*
   * UPDATE TEMPLATE
   *
   * 1. Check duplicate trigger + channel.
   * 2. Update template.
   * 3. Delete removed variables.
   * 4. Update existing variables.
   * 5. Create new variables.
   * 6. Refresh templates.
   */
  const handleUpdate = async (
    templateId,
    data,
    variables = [],
    deletedVariableIds = []
  ) => {
    setActionError("");

    try {
      /*
       * Prevent duplicate trigger + channel combination.
       */
      const duplicate = (templates || []).find(
        (template) =>
          template.id !== templateId &&
          String(template.trigger) === String(data.trigger) &&
          template.channel === data.channel
      );

      if (duplicate) {
        throw new Error(
          `A ${CHANNEL_LABELS[data.channel] || data.channel} template already exists for this trigger.`
        );
      }


      /*
       * Update main template.
       */
      await dispatch(
        updateTemplate({
          id: templateId,
          data,
        })
      ).unwrap();


      /*
       * Delete variables removed by the user.
       *
       * We do this before creating/updating variables because
       * variable_name is unique per template.
       */
      const deletedIds = Array.isArray(deletedVariableIds)
        ? deletedVariableIds.filter(Boolean)
        : [];

      for (const variableId of deletedIds) {
        await dispatch(deleteVariable(variableId)).unwrap();
      }


      /*
       * Normalize variables coming from TemplateForm.
       */
      const cleanVariables = normalizeVariables(variables);


      /*
       * Update existing variables and create new variables.
       */
      for (const variable of cleanVariables) {
        const variableData = {
          variable_name: variable.variable_name,
          variable_value: variable.variable_value,
        };

        if (variable.id) {
          await dispatch(
            updateVariable({
              id: variable.id,
              data: variableData,
            })
          ).unwrap();
        } else {
          await dispatch(
            createVariable({
              templateId,
              data: variableData,
            })
          ).unwrap();
        }
      }


      /*
       * Refresh template list.
       */
      await dispatch(fetchTemplates()).unwrap();

      closeModal();
    } catch (error) {
      console.error("Update template error:", error);

      const message = getApiError(error);

      setActionError(message);

      throw error;
    }
  };


  /*
   * DELETE TEMPLATE
   */
  const handleDelete = async (template) => {
    const confirmed = window.confirm(
      `Delete the ${CHANNEL_LABELS[template.channel] || template.channel} template for "${getTriggerName(
        template.trigger
      )}"?`
    );

    if (!confirmed) {
      return;
    }

    setActionError("");

    try {
      await dispatch(
        deleteTemplate(template.id)
      ).unwrap();

      await dispatch(fetchTemplates()).unwrap();
    } catch (error) {
      console.error("Delete template error:", error);

      setActionError(getApiError(error));
    }
  };


  const getStatusClass = (isActive) => {
    return isActive
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-600";
  };


  const getChannelClass = (channel) => {
    switch (channel) {
      case CHANNELS.WHATSAPP:
        return "bg-green-100 text-green-700";

      case CHANNELS.EMAIL:
        return "bg-blue-100 text-blue-700";

      case CHANNELS.WEB_PUSH:
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Notification Templates
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage notification templates and variables for every channel.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={triggersLoading}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Create Template
          </button>
        </div>


        {/* Error */}
        {(actionError || templatesError) && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError || getApiError(templatesError)}
          </div>
        )}


        {/* Filters */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">

            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search templates..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <select
              value={channelFilter}
              onChange={(event) =>
                setChannelFilter(event.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Channels</option>
              <option value={CHANNELS.WHATSAPP}>
                WhatsApp
              </option>
              <option value={CHANNELS.EMAIL}>
                Email
              </option>
              <option value={CHANNELS.WEB_PUSH}>
                Web Push
              </option>
            </select>
          </div>
        </div>


        {/* Loading */}
        {templatesLoading && (
          <div className="mb-4 rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
            Loading templates...
          </div>
        )}


        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">

              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Trigger
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Channel
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Subject / Title
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Message
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>


              <tbody className="divide-y divide-gray-100">

                {!templatesLoading &&
                  filteredTemplates.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-5 py-12 text-center"
                      >
                        <div className="text-sm font-medium text-gray-600">
                          No templates found
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          Create a template or change your filters.
                        </div>
                      </td>
                    </tr>
                  )}


                {filteredTemplates.map((template) => {
                  const channel =
                    CHANNEL_LABELS[template.channel] ||
                    template.channel ||
                    "Unknown";

                  const title =
                    template.subject ||
                    template.title ||
                    "—";

                  const body =
                    template.body ||
                    "—";

                  return (
                    <tr
                      key={template.id}
                      className="transition hover:bg-gray-50"
                    >

                      {/* Trigger */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">
                          {getTriggerName(template.trigger)}
                        </div>

                        {triggerMap[template.trigger]?.event_key && (
                          <div className="mt-1 text-xs text-gray-400">
                            {triggerMap[template.trigger].event_key}
                          </div>
                        )}
                      </td>


                      {/* Channel */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getChannelClass(
                            template.channel
                          )}`}
                        >
                          {channel}
                        </span>
                      </td>


                      {/* Subject / Title */}
                      <td className="max-w-[220px] px-5 py-4">
                        <div className="truncate text-sm font-medium text-gray-800">
                          {title}
                        </div>
                      </td>


                      {/* Body */}
                      <td className="max-w-[350px] px-5 py-4">
                        <div className="line-clamp-2 text-sm text-gray-600">
                          {body}
                        </div>
                      </td>


                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                            template.is_active
                          )}`}
                        >
                          {template.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>


                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(template)
                            }
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(template)
                            }
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}

              </tbody>
            </table>
          </div>
        </div>


        {/* Summary */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">
              Total Templates
            </div>

            <div className="mt-2 text-2xl font-bold text-gray-900">
              {templates?.length || 0}
            </div>
          </div>


          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">
              Active Templates
            </div>

            <div className="mt-2 text-2xl font-bold text-green-600">
              {(templates || []).filter(
                (template) => template.is_active
              ).length}
            </div>
          </div>


          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">
              Inactive Templates
            </div>

            <div className="mt-2 text-2xl font-bold text-gray-500">
              {(templates || []).filter(
                (template) => !template.is_active
              ).length}
            </div>
          </div>

        </div>

      </div>


      {/* Template Modal */}
      {modalOpen && (
        <TemplateModal
          isOpen={modalOpen}
          onClose={closeModal}
          template={selectedTemplate}
          triggers={triggers}
          templates={templates}
          loading={templatesLoading}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}

    </div>
  );
}

export default NotificationTemplates;