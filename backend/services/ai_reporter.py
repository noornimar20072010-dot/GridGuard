"""AI-generated operator summaries for critical alerts.

This module calls the Claude API to generate plain-English summaries of critical
alerts for grid operators. It is a pure text-generation service with no decision-
making power — it receives already-computed telemetry and prediction data and
returns an explanatory summary. It must not alter health status, alerts, or
prediction values.
"""

import anthropic

from utils.config import CLAUDE_API_KEY


def generate_operator_summary(
    transformer_id: str,
    current_load: float,
    predicted_load: float,
    temperature: float | None,
) -> str:
    """Generate a plain-English operator summary for a critical alert.

    Takes the transformer's current and predicted load, plus latest temperature,
    and returns a 2-3 sentence summary explaining the situation and recommending
    action. Pure text generation only — does not modify any data.

    Args:
        transformer_id: The transformer's ID (e.g., "T-201")
        current_load: Current load in percentage (e.g., 94.0)
        predicted_load: Forecasted load in 5 minutes in percentage (e.g., 102.0)
        temperature: Latest temperature reading in Celsius, or None

    Returns:
        A plain-English summary string (2-3 sentences) suitable for an operator
        to read and act on.
    """
    if not CLAUDE_API_KEY:
        return f"Transformer {transformer_id} is at critical load: {current_load}% current, {predicted_load}% predicted. Temperature: {temperature}°C. Urgent manual review required."

    try:
        client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

        # Construct a minimal prompt that describes the situation
        # without asking Claude to make decisions.
        prompt = f"""You are a grid operations advisor. An automated prediction engine has flagged a critical overload condition for transformer {transformer_id}.

Current situation:
- Transformer ID: {transformer_id}
- Current load: {current_load}% of rated capacity
- Predicted load in 5 minutes: {predicted_load}% of rated capacity
- Temperature: {temperature}°C if available

Write a brief (2-3 sentence), plain-English summary for the grid operator explaining:
1. What is happening (current and predicted load trend)
2. Why it matters (transformer is approaching or exceeding safe limits)
3. A recommended action (e.g., "Consider load shedding" or "Monitor closely and prepare emergency protocols")

Keep the tone professional and actionable. Do not make the decision for the operator — only provide context and suggest action."""

        message = client.messages.create(
            model="claude-opus-5",
            max_tokens=150,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        summary = message.content[0].text.strip()
        return summary

    except anthropic.APIError as e:
        # Graceful fallback if Claude API is unavailable
        return f"Transformer {transformer_id} is at critical load: {current_load}% current, forecasted {predicted_load}% in 5 minutes. Temperature: {temperature}°C. Immediate operator review required. (AI summary unavailable: {str(e)})"
