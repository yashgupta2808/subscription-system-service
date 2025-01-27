import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface ServiceStackProps extends StackProps {
  subscriptionsTable: Table;
}

export class ServiceStack extends Stack {
  readonly createSubscriptionLambda: Function;
  readonly getSubscriptionLambda: Function;
  readonly cancelSubscriptionLambda: Function;

  readonly restApi: RestApi;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    this.createSubscriptionLambda = new Function(
      this,
      "CreateSubscriptionHandler",
      {
        functionName: "CreateSubscriptionHandler",
        runtime: Runtime.NODEJS_18_X,
        handler: "create-subscription.handler",
        code: Code.fromAsset(
          "src/services/subscriptions/dist/create-subscription"
        ),
        timeout: Duration.seconds(10),
        environment: {
          SUBSCRIPTIONS_TABLE: props.subscriptionsTable.tableName,
        },
      }
    );

    this.getSubscriptionLambda = new Function(this, "GetSubscriptionHandler", {
      functionName: "GetSubscriptionHandler",
      runtime: Runtime.NODEJS_18_X,
      handler: "get-subscription.handler",
      code: Code.fromAsset("src/services/subscriptions/dist/get-subscription"),
      timeout: Duration.seconds(10),
      environment: {
        SUBSCRIPTIONS_TABLE: props.subscriptionsTable.tableName,
      },
    });

    this.cancelSubscriptionLambda = new Function(
      this,
      "CancelSubscriptionHandler",
      {
        functionName: "CancelSubscriptionHandler",
        runtime: Runtime.NODEJS_18_X,
        handler: "cancel-subscription.handler",
        code: Code.fromAsset(
          "src/services/subscriptions/dist/cancel-subscription"
        ),
        timeout: Duration.seconds(10),
        environment: {
          SUBSCRIPTIONS_TABLE: props.subscriptionsTable.tableName,
        },
      }
    );

    this.restApi = new RestApi(this, "SubscriptionApi", {
      restApiName: "SubscriptionApi",
    });

    const subscribeResource = this.restApi.root.addResource("subscribe");

    subscribeResource.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST", "GET"],
      allowHeaders: ["Content-Type"],
    });

    subscribeResource.addMethod(
      "POST",
      new LambdaIntegration(this.createSubscriptionLambda)
    );
    subscribeResource.addMethod(
      "GET",
      new LambdaIntegration(this.getSubscriptionLambda),
      {
        requestParameters: {
          "method.request.querystring.email": true,
        },
      }
    );

    const cancelResource = subscribeResource.addResource("cancel");

    cancelResource.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST"],
      allowHeaders: ["Content-Type"],
    });

    cancelResource.addMethod(
      "POST",
      new LambdaIntegration(this.cancelSubscriptionLambda)
    );

    const dynamoDbPutPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["dynamodb:PutItem"],
      resources: [props.subscriptionsTable.tableArn],
    });
    const dynamoDbGetPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["dynamodb:GetItem"],
      resources: [props.subscriptionsTable.tableArn],
    });
    const dynamoDbDeletePolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["dynamodb:DeleteItem"],
      resources: [props.subscriptionsTable.tableArn],
    });

    this.createSubscriptionLambda.addToRolePolicy(dynamoDbPutPolicy);
    this.getSubscriptionLambda.addToRolePolicy(dynamoDbPutPolicy);
    this.getSubscriptionLambda.addToRolePolicy(dynamoDbGetPolicy);
    this.cancelSubscriptionLambda.addToRolePolicy(dynamoDbDeletePolicy);
  }
}
