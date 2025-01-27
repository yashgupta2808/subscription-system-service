import { Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class PersistentStack extends Stack {
  readonly subscriptionsTable: Table;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.subscriptionsTable = new Table(this, "SubscriptionsTable", {
      partitionKey: { name: "user_email", type: AttributeType.STRING },
      tableName: "Subscriptions",
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
  }
}
