import * as cdk from "aws-cdk-lib";
import { ServiceStack } from "./stacks/service-stack";
import { PersistentStack } from "./stacks/persistent-stack";
import { AuthenticationStack } from "./stacks/authentication-stack";

const app = new cdk.App();

new AuthenticationStack(app, "AuthenticationStack", {});

const persistentStack = new PersistentStack(app, "PersistentStack", {});

new ServiceStack(app, "ServiceStack", {
  subscriptionsTable: persistentStack.subscriptionsTable,
});
