import {
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { CORS_HEADERS, formatDate } from "./utils";

const dynamoDb = new DynamoDBClient({
  region: "us-east-1",
});

const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE!;

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const email = event.queryStringParameters?.email;
    if (!email) {
      console.warn("Missing email in query parameters");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email is required." }),
        headers: CORS_HEADERS,
      };
    }

    console.log("Getting item from DynamoDB for email:", email);
    const command = new GetItemCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: {
        user_email: { S: email },
      },
    });

    const result = await dynamoDb.send(command);
    console.log("Received result from DynamoDB:", result);

    if (!result.Item) {
      console.info("Subscription not found for email:", email);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Subscription not found." }),
        headers: CORS_HEADERS,
      };
    }

    const subscription = unmarshall(result.Item);
    const currentDate = formatDate(new Date());
    const endDate = subscription.endDate;
    if (currentDate > endDate) {
      console.log("Subscription expired, updating status to EXPIRED");
      const updateCommand = new PutItemCommand({
        TableName: SUBSCRIPTIONS_TABLE,
        Item: {
          ...result.Item,
          status: { S: "EXPIRED" },
        },
      });

      await dynamoDb.send(updateCommand);
      console.log("Successfully updated subscription status to EXPIRED");

      subscription.status = "EXPIRED";
    }
    return {
      statusCode: 200,
      body: JSON.stringify(subscription),
      headers: CORS_HEADERS,
    };
  } catch (error) {
    console.error("Error handling request:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
      headers: CORS_HEADERS,
    };
  }
};
