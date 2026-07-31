"""Chat assistant for answering operator questions about the grid.

This service provides a conversational interface for operators to ask free-form
questions about transformer status, predictions, alerts, and grid conditions.

It is strictly read-only: it gathers live data from existing services and calls
the Claude API to answer questions based on that context. It does not modify
any data, make predictions, or alter health status — those responsibilities
remain with the deterministic prediction engine.
"""

import anthropic

from database.session import SessionLocal
from models.alert import Alert
from services.predictor import get_recent_telemetry
from services.transformer_service import get_transformer, list_transformers
from utils.config import CLAUDE_API_KEY


def get_active_alerts() -> list[dict]:
    """Fetch all active (unresolved) alerts."""
    db = SessionLocal()
    try:
        alerts = db.query(Alert).filter(Alert.resolved_at.is_(None)).all()
        return [
            {
                "transformer_id": alert.transformer_id,
                "health_status": alert.health_status,
                "reason": alert.reason,
                "created_at": alert.created_at.isoformat() if alert.created_at else None,
            }
            for alert in alerts
        ]
    finally:
        db.close()


def gather_grid_context(transformer_id: str | None = None) -> str:
    """Gather live grid data to provide as context for answering questions.

    If transformer_id is provided, includes detailed history for that transformer.
    Otherwise, includes a summary of all transformers and active alerts.

    Returns a formatted string suitable for passing to Claude API.
    """
    lines = []
    lines.append("=== GRIDGUARD LIVE DATA SNAPSHOT ===\n")

    # Get all transformers
    all_transformers = list_transformers()
    lines.append(f"Total transformers monitored: {len(all_transformers)}\n")

    # Summary by zone
    zones = {}
    for t in all_transformers:
        if t.zone not in zones:
            zones[t.zone] = []
        zones[t.zone].append(t)

    lines.append("\nTRANSFORMER SUMMARY BY ZONE:")
    for zone in sorted(zones.keys()):
        lines.append(f"\n  {zone}:")
        for t in zones[zone]:
            status_indicator = "🔴" if t.health_status == "critical" else "🟡" if t.health_status == "warning" else "🟢"
            lines.append(
                f"    {status_indicator} {t.id}: {t.current_load:.1f}% current, {t.predicted_load:.1f}% predicted ({t.health_status})"
            )

    # Active alerts
    active_alerts = get_active_alerts()
    if active_alerts:
        lines.append("\n\nACTIVE ALERTS:")
        for alert in active_alerts:
            lines.append(f"  • {alert['transformer_id']} ({alert['health_status']}): {alert['reason']}")
    else:
        lines.append("\n\nNo active alerts.")

    # Detailed context for a specific transformer
    if transformer_id:
        lines.append(f"\n\nDETAILED CONTEXT FOR {transformer_id}:")
        t = get_transformer(transformer_id)
        if t:
            lines.append(f"  Zone: {t.zone}")
            lines.append(f"  Current Load: {t.current_load:.1f}%")
            lines.append(f"  Predicted Load: {t.predicted_load:.1f}%")
            lines.append(f"  Health Status: {t.health_status}")
            lines.append(f"  Voltage: {t.voltage} kV")
            lines.append(f"  Current: {t.current} A")
            lines.append(f"  Temperature: {t.temperature}°C")
            lines.append(f"  Last Updated: {t.last_updated}")

            # Recent telemetry history
            db = SessionLocal()
            try:
                telemetry_history = get_recent_telemetry(db, transformer_id, 10)
                if telemetry_history:
                    lines.append(f"\n  Recent Load History (last 10 readings):")
                    for telem in telemetry_history:
                        lines.append(
                            f"    {telem.recorded_at}: {telem.load:.1f}% load, {telem.temperature:.1f}°C"
                        )
            finally:
                db.close()
        else:
            lines.append(f"  Transformer not found.")

    return "\n".join(lines)


def answer_question(question: str, transformer_id: str | None = None) -> str:
    """Answer an operator's question about the grid using live data.

    Args:
        question: The operator's natural-language question (e.g., "Which transformers are at risk?")
        transformer_id: Optional transformer ID to provide detailed context for

    Returns:
        A plain-English answer based on the current grid state.
    """
    if not CLAUDE_API_KEY:
        return "Chat assistant is not configured (missing CLAUDE_API_KEY). Please check backend configuration."

    try:
        # Gather current grid context
        context = gather_grid_context(transformer_id)

        # Create Claude client
        client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

        # System prompt that constrains Claude to answer based on provided data only
        system_prompt = """You are a grid operations assistant for GridGuard, a predictive transformer monitoring system.

Your role is to help operators understand the current state of their electrical grid by answering questions about:
- Transformer load status (current and predicted)
- Health status classifications (healthy, warning, critical)
- Active alerts
- Telemetry trends

IMPORTANT CONSTRAINTS:
1. You are ONLY an advisor. You do not make decisions about health status or predictions — those are computed by the deterministic GridGuard engine.
2. Answer questions based ONLY on the live data provided below. Do not invent or assume data.
3. Be concise, professional, and actionable in your responses.
4. If you don't have information to answer the question, say so clearly.
5. Always explain the current state before recommending any action.

Respond in plain English suitable for a grid operator to read and act on."""

        # Call Claude API
        message = client.messages.create(
            model="claude-opus-5",
            max_tokens=500,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"""Here is the current grid state:

{context}

---

Operator Question: {question}""",
                }
            ],
        )

        # Extract text from message content, handling ThinkingBlock and TextBlock
        for block in message.content:
            if hasattr(block, 'text'):
                return block.text.strip()

        return "Unable to generate response."

    except anthropic.APIError as e:
        return f"I was unable to answer your question due to a service error: {str(e)}. Please try again or contact support."
