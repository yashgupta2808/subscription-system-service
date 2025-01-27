import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { CORS_HEADERS, formatDate } from "./utils";

export const dynamoDb = new DynamoDBClient({
  region: "us-east-1",
});

export const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  try {
    const { email, planId } = JSON.parse(event.body || "{}");
    if (!email || !planId) {
      console.warn("Missing email or planId in request body");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email and PlanId are required." }),
        headers: CORS_HEADERS,
      };
    }

    const subscriptionId = uuidv4();
    const startDate = formatDate(new Date());
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateString = formatDate(endDate);

    const item = {
      user_email: { S: email },
      subscription_id: { S: subscriptionId },
      planId: { S: planId },
      status: { S: "ACTIVE" },
      startDate: { S: startDate },
      endDate: { S: endDateString },
    };

    console.log("Putting item into DynamoDB:", item);
    const command = new PutItemCommand({
      TableName: SUBSCRIPTIONS_TABLE,
      Item: item,
    });

    await dynamoDb.send(command);
    console.log("Successfully put item into DynamoDB");

    return {
      statusCode: 201,
      body: JSON.stringify(item),
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
