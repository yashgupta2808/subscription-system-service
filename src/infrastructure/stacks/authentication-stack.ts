import { Stack, StackProps } from "aws-cdk-lib";
import {
  AccountRecovery,
  UserPool,
  UserPoolClient,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class AuthenticationStack extends Stack {
  readonly subscriptionCognito: UserPool;
  readonly subscriptionAppClient: UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.subscriptionCognito = new UserPool(this, "SubscriptionCognito", {
      userPoolName: "SubscriptionCognito",
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: true,
        requireSymbols: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
        fullname: {
          required: true,
          mutable: true,
        },
      },
      selfSignUpEnabled: true,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      autoVerify: {
        email: true,
      },
      signInAliases: {
        email: true,
      },
      deletionProtection: false,
      userVerification: {
        emailStyle: VerificationEmailStyle.CODE,
        emailSubject: "Verify your email address",
        emailBody: `
          <html>
            <head>
              <style>
                .email-body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                }
                .header {
                  background-color: #4CAF50;
                  color: white;
                  padding: 10px;
                  text-align: center;
                }
                .content {
                  padding: 20px;
                }
                .footer {
                  background-color: #f1f1f1;
                  color: #333;
                  padding: 10px;
                  text-align: center;
                  font-size: 12px;
                }
                .code {
                  font-weight: bold;
                  color: #4CAF50;
                  font-size: 24px;
                }
              </style>
            </head>
            <body>
              <div class="email-body">
                <div class="header">
                  <h1>Subscription System</h1>
                </div>
                <div class="content">
                  <p>Thanks for signing up to our subscription service!</p>
                  <p>Help us verify your email address by entering the following code: </p>
                  <span class="code">{####}</span>
                </div>
                <div class="footer">
                  <p>&copy; 2025 Subscription System. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      },
    });

    this.subscriptionAppClient = new UserPoolClient(
      this,
      "SubscriptionAppClient",
      {
        userPool: this.subscriptionCognito,
        userPoolClientName: "SubscriptionAppClient",
        authFlows: {
          userSrp: true,
        },
      }
    );
  }
}
