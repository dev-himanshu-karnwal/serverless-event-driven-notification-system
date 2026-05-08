import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";

const eventBridge = new EventBridgeClient({ region: process.env.REGION });
const db = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.REGION }),
);

export const hello = async (event) => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Go Serverless v1.0! Your function executed successfully!",
    }),
  };
};

export const publishEvent = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const params = {
      Entries: [
        {
          Source: "app.user",
          DetailType: body.type,
          Detail: JSON.stringify(body),
          EventBusName: process.env.EVENT_BUS_NAME,
        },
      ],
    };

    await eventBridge.send(new PutEventsCommand(params));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Event sent" }),
    };
  } catch (err) {
    console.error("ERROR:", err);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Failed to publish event" }),
    };
  }
};

export const emailConsumer = async (event) => {
  for (const record of event.detail ? [event] : []) {
    console.log(
      JSON.stringify({
        service: "email-service",
        action: "send-welcome-email",
        userId: record.detail.userId,
        timestamp: Date.now(),
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

export const analyticsConsumer = async (event) => {
  const detail = event.detail;

  await db.send(
    new PutCommand({
      TableName: "analytics-events",
      Item: {
        eventId: nanoid(),
        type: detail.type,
        userId: detail.userId,
        createdAt: Date.now(),
      },
    }),
  );

  console.log(
    JSON.stringify({
      service: "analytics-service",
      status: "stored",
      userId: detail.userId,
    }),
  );
};

export const logConsumer = async (event) => {
  console.log(
    JSON.stringify({
      service: "audit-log-service",
      source: event.source,
      detailType: event["detail-type"],
      payload: event.detail,
      receivedAt: Date.now(),
    }),
  );
};
