import re

from notifications.models import NotificationTemplate


# ============================================================
# VARIABLE PATTERN
# ============================================================

VARIABLE_PATTERN = re.compile(
    r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}"
)


# ============================================================
# RENDER TEXT
# ============================================================

def render_text(
    text: str,
    context: dict,
) -> str:
    """
    Replace template variables with actual values.

    Example:

        Template:
            Hello {{user_name}}

        Context:
            {
                "user_name": "Abhishek"
            }

        Result:
            Hello Abhishek
    """

    if not text:
        return text

    def replace_variable(match):

        variable_name = match.group(1)

        value = context.get(
            variable_name
        )

        # If runtime value doesn't exist,
        # keep the placeholder.
        if value is None:
            return match.group(0)

        return str(value)

    return VARIABLE_PATTERN.sub(
        replace_variable,
        text,
    )


# ============================================================
# BUILD TEMPLATE CONTEXT
# ============================================================

def build_template_context(
    template: NotificationTemplate,
    context: dict | None = None,
) -> dict:
    """
    Build final variable values.

    Database values are used as defaults.

    Runtime context overrides database values.
    """

    context = context or {}

    template_context = {}

    # --------------------------------------------------------
    # Get variables belonging to this template
    # --------------------------------------------------------

    for variable in template.variables.all():

        variable_name = (
            variable.variable_name or ""
        ).strip()

        if not variable_name:
            continue

        # ----------------------------------------------------
        # Runtime value has priority
        # ----------------------------------------------------

        if variable_name in context:

            template_context[
                variable_name
            ] = context[variable_name]

        else:

            # ------------------------------------------------
            # Otherwise use saved variable value
            # ------------------------------------------------

            template_context[
                variable_name
            ] = variable.variable_value or ""

    # --------------------------------------------------------
    # Add other runtime values too
    # --------------------------------------------------------

    for key, value in context.items():

        template_context[key] = value

    return template_context


# ============================================================
# RENDER TEMPLATE
# ============================================================

def render_template(
    template: NotificationTemplate,
    context: dict | None = None,
) -> dict:
    """
    Render title, subject and body.
    """

    template_context = build_template_context(
        template,
        context,
    )

    return {
        "title": render_text(
            template.title or "",
            template_context,
        ),

        "subject": render_text(
            template.subject or "",
            template_context,
        ),

        "body": render_text(
            template.body or "",
            template_context,
        ),
    }