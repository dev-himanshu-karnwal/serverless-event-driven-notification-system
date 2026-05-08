import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";

const eventBridge = new EventBridgeClient({ region: process.env.REGION });

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
      body: JSON.stringify({ message: "Event sent" }),
    };
  } catch (err) {
    console.error("ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to publish event" }),
    };
  }
};
