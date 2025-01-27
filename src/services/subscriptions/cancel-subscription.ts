import { DeleteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { CORS_HEADERS } from "./utils";

const dynamoDb = new DynamoDBClient({
  region: "us-east-1",
});

const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Handling POST request");
    const { email } = JSON.parse(event.body || "{}");
    if (!email) {
      console.warn("Missing email in request body");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email is required." }),
        headers: CORS_HEADERS,
      };
    }

    const command = new DeleteItemCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: {
        user_email: { S: email },
      },
    });

    console.log("Deleting item from DynamoDB:", command);
    await dynamoDb.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Subscription cancelled successfully" }),
      headers: CORS_HEADERS,
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
      headers: CORS_HEADERS,
    };
  }
};
