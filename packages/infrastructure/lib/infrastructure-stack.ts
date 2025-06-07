import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class TodoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Infrastructure will be implemented in Phase 2
    console.log('TodoAppStack placeholder');
  }
}