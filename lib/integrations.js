/**
 * Integration utilities for Slack, webhooks, and notifications
 */

/**
 * Send Slack notification
 */
export async function sendSlackNotification(webhookUrl, message) {
  if (!webhookUrl) return { success: false, error: 'No webhook URL' };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Slack notification failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format Slack message for new feedback
 */
export function formatNewFeedbackSlack(feedback, workspaceName, feedbackUrl) {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '💡 New Feedback Submitted',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Workspace:*\n${workspaceName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Author:*\n${feedback.authorName || 'Anonymous'}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${feedback.title}*\n${feedback.description?.slice(0, 200) || 'No description'}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Feedback',
              emoji: true,
            },
            url: feedbackUrl,
            style: 'primary',
          },
        ],
      },
    ],
  };
}

/**
 * Format Slack message for shipped item
 */
export function formatShippedSlack(title, workspaceName, changelogUrl) {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚀 Feature Shipped!',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${title}*\nA new feature has been shipped in *${workspaceName}*`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Changelog',
              emoji: true,
            },
            url: changelogUrl,
            style: 'primary',
          },
        ],
      },
    ],
  };
}

/**
 * Send webhook notification
 */
export async function sendWebhook(webhookUrl, webhookSecret, event, payload) {
  if (!webhookUrl) return { success: false, error: 'No webhook URL' };

  try {
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const headers = {
      'Content-Type': 'application/json',
    };

    // Add signature if secret is set
    if (webhookSecret) {
      const crypto = await import('crypto');
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');
      headers['X-Signature-256'] = `sha256=${signature}`;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body,
    });

    return { success: response.ok, status: response.status };
  } catch (error) {
    console.error('Webhook failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Trigger integration events
 */
export async function triggerIntegrationEvent(workspace, event, data) {
  const results = { slack: null, webhook: null };
  const integrations = workspace.integrations || {};

  // Slack notification
  if (integrations.slackWebhookUrl && integrations.slackEvents?.includes(event)) {
    let message;
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    switch (event) {
      case 'feedback.created':
        message = formatNewFeedbackSlack(
          data,
          workspace.name,
          `${baseUrl}/p/${workspace.slug}/feedback/${data.id}`
        );
        break;
      case 'roadmap.shipped':
        message = formatShippedSlack(
          data.title,
          workspace.name,
          `${baseUrl}/p/${workspace.slug}/changelog`
        );
        break;
      default:
        message = {
          text: `[${workspace.name}] ${event}: ${JSON.stringify(data)}`,
        };
    }

    results.slack = await sendSlackNotification(integrations.slackWebhookUrl, message);
  }

  // Custom webhook
  if (integrations.webhookUrl && integrations.webhookEvents?.includes(event)) {
    results.webhook = await sendWebhook(
      integrations.webhookUrl,
      integrations.webhookSecret,
      event,
      { workspace: { id: workspace._id.toString(), name: workspace.name }, ...data }
    );
  }

  return results;
}
