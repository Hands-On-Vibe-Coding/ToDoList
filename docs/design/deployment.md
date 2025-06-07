# 환경 설정 및 배포

## 개요
이 문서는 ToDo 애플리케이션의 환경 설정, 인프라 구성, 그리고 배포 프로세스를 정의합니다.

---

## 1. 환경 변수 설정

### 1.1 Frontend 환경 변수 (`.env.local`)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.todoapp.com
NEXT_PUBLIC_APP_URL=https://todoapp.com

# AWS Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_COGNITO_REGION=us-east-1

# Analytics (Optional)
NEXT_PUBLIC_GA_TRACKING_ID=GA_TRACKING_ID

# Development Settings
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

### 1.2 Backend 환경 변수
```bash
# Database
DYNAMODB_TABLE_PREFIX=TodoApp
DYNAMODB_REGION=us-east-1
USERS_TABLE_NAME=TodoApp-Users
TODOS_TABLE_NAME=TodoApp-Todos

# Authentication
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXX
COGNITO_REGION=us-east-1

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# API Configuration
CORS_ORIGINS=https://todoapp.com,http://localhost:3000
RATE_LIMIT_PER_MINUTE=100

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
NODE_ENV=production
```

### 1.3 Infrastructure 환경 변수
```bash
# Stack Configuration
STACK_NAME=TodoAppStack
ENVIRONMENT=production
DOMAIN_NAME=todoapp.com
API_DOMAIN_NAME=api.todoapp.com

# Certificate (ACM)
CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/xxx

# Monitoring & Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
ALERT_EMAIL=alerts@todoapp.com

# CDK Configuration
CDK_DEFAULT_ACCOUNT=123456789012
CDK_DEFAULT_REGION=us-east-1
```

---

## 2. 설정 파일 구조

### 2.1 Tailwind CSS 설정 (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          500: '#6b7280',
          600: '#4b5563',
          900: '#111827',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fefce8',
          500: '#eab308',
          600: '#ca8a04',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class',
}
```

### 2.2 Next.js 설정 (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['api.todoapp.com'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ];
  },
  // PWA 설정 (선택사항)
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: true,
    },
  }),
}

module.exports = nextConfig
```

### 2.3 TypeScript 설정 (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2.4 ESLint 설정 (`.eslintrc.js`)
```javascript
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'react/display-name': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true,
      },
    },
  ],
}
```

### 2.5 Prettier 설정 (`.prettierrc`)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

---

## 3. AWS CDK 인프라 구성

### 3.1 메인 스택 (`packages/infrastructure/lib/infrastructure-stack.ts`)
```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class TodoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Environment variables
    const environment = process.env.ENVIRONMENT || 'development';
    const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || 'TodoApp';

    // DynamoDB Tables
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `${tablePrefix}-Users-${environment}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
      pointInTimeRecovery: environment === 'production',
    });

    // GSI for email lookup
    usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
    });

    const todosTable = new dynamodb.Table(this, 'TodosTable', {
      tableName: `${tablePrefix}-Todos-${environment}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
      pointInTimeRecovery: environment === 'production',
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${tablePrefix}-UserPool-${environment}`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      authFlows: {
        adminUserPassword: true,
        userSrp: true,
      },
      generateSecret: false, // For frontend applications
    });

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions
    usersTable.grantReadWriteData(lambdaRole);
    todosTable.grantReadWriteData(lambdaRole);

    // Grant Cognito permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminSetUserPassword',
        'cognito-idp:AdminInitiateAuth',
        'cognito-idp:AdminGetUser',
      ],
      resources: [userPool.userPoolArn],
    }));

    // Common environment variables for Lambda functions
    const commonEnvironment = {
      USERS_TABLE_NAME: usersTable.tableName,
      TODOS_TABLE_NAME: todosTable.tableName,
      COGNITO_USER_POOL_ID: userPool.userPoolId,
      COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
      JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
      CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000',
    };

    // Auth Lambda Functions
    const signupHandler = new NodejsFunction(this, 'SignupHandler', {
      entry: 'packages/backend/src/handlers/auth/signup.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    const signinHandler = new NodejsFunction(this, 'SigninHandler', {
      entry: 'packages/backend/src/handlers/auth/signin.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    const refreshHandler = new NodejsFunction(this, 'RefreshHandler', {
      entry: 'packages/backend/src/handlers/auth/refresh.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    const meHandler = new NodejsFunction(this, 'MeHandler', {
      entry: 'packages/backend/src/handlers/auth/me.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Todo Lambda Functions
    const todoListHandler = new NodejsFunction(this, 'TodoListHandler', {
      entry: 'packages/backend/src/handlers/todos/list.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    const todoCreateHandler = new NodejsFunction(this, 'TodoCreateHandler', {
      entry: 'packages/backend/src/handlers/todos/create.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    const todoGetHandler = new NodejsFunction(this, 'TodoGetHandler', {
      entry: 'packages/backend/src/handlers/todos/get.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    const todoUpdateHandler = new NodejsFunction(this, 'TodoUpdateHandler', {
      entry: 'packages/backend/src/handlers/todos/update.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    const todoDeleteHandler = new NodejsFunction(this, 'TodoDeleteHandler', {
      entry: 'packages/backend/src/handlers/todos/delete.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    const todoUpdateStatusHandler = new NodejsFunction(this, 'TodoUpdateStatusHandler', {
      entry: 'packages/backend/src/handlers/todos/updateStatus.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'TodoApi', {
      restApiName: `${tablePrefix}-API-${environment}`,
      description: 'Todo Application API',
      defaultCorsPreflightOptions: {
        allowOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Auth routes
    const authResource = api.root.addResource('auth');
    authResource.addResource('signup').addMethod('POST', new apigateway.LambdaIntegration(signupHandler));
    authResource.addResource('signin').addMethod('POST', new apigateway.LambdaIntegration(signinHandler));
    authResource.addResource('refresh').addMethod('POST', new apigateway.LambdaIntegration(refreshHandler));
    authResource.addResource('me').addMethod('GET', new apigateway.LambdaIntegration(meHandler));

    // Todo routes
    const todosResource = api.root.addResource('todos');
    todosResource.addMethod('GET', new apigateway.LambdaIntegration(todoListHandler));
    todosResource.addMethod('POST', new apigateway.LambdaIntegration(todoCreateHandler));

    const todoResource = todosResource.addResource('{id}');
    todoResource.addMethod('GET', new apigateway.LambdaIntegration(todoGetHandler));
    todoResource.addMethod('PUT', new apigateway.LambdaIntegration(todoUpdateHandler));
    todoResource.addMethod('DELETE', new apigateway.LambdaIntegration(todoDeleteHandler));

    const todoStatusResource = todoResource.addResource('status');
    todoStatusResource.addMethod('PATCH', new apigateway.LambdaIntegration(todoUpdateStatusHandler));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });
  }
}
```

### 3.2 CDK 앱 구성 (`packages/infrastructure/bin/infrastructure.ts`)
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TodoAppStack } from '../lib/infrastructure-stack';

const app = new cdk.App();

const environment = process.env.ENVIRONMENT || 'development';
const stackName = process.env.STACK_NAME || `TodoApp-${environment}`;

new TodoAppStack(app, stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Environment: environment,
    Project: 'TodoApp',
  },
});
```

---

## 4. GitHub Actions CI/CD

### 4.1 PR 검증 워크플로우 (`.github/workflows/pr-validation.yml`)
```yaml
name: PR Validation

on:
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Lint check
        run: pnpm run lint
        
      - name: Type check
        run: pnpm run type-check
        
      - name: Run tests
        run: pnpm run test
        
      - name: Build validation
        run: pnpm run build
        
      - name: Check bundle size
        run: pnpm run analyze

  security:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Run security audit
        run: pnpm audit
        
      - name: Run CodeQL Analysis
        uses: github/codeql-action/analyze@v2
        with:
          languages: typescript
```

### 4.2 배포 워크플로우 (`.github/workflows/deploy.yml`)
```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'production'
        type: choice
        options:
          - production
          - staging

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build backend
        run: pnpm run build:backend
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ vars.AWS_REGION }}
          
      - name: Deploy infrastructure
        run: |
          cd packages/infrastructure
          npx cdk bootstrap
          npx cdk deploy --require-approval never
        env:
          ENVIRONMENT: ${{ github.event.inputs.environment || 'production' }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          
      - name: Store deployment outputs
        run: |
          cd packages/infrastructure
          npx cdk output --format json > cdk-outputs.json
          
      - name: Upload deployment outputs
        uses: actions/upload-artifact@v3
        with:
          name: cdk-outputs
          path: packages/infrastructure/cdk-outputs.json

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Download deployment outputs
        uses: actions/download-artifact@v3
        with:
          name: cdk-outputs
          
      - name: Extract API URL
        run: |
          API_URL=$(jq -r '.TodoAppStack.ApiUrl' cdk-outputs.json)
          echo "NEXT_PUBLIC_API_URL=$API_URL" >> $GITHUB_ENV
          
      - name: Build frontend
        run: pnpm run build:frontend
        env:
          NEXT_PUBLIC_API_URL: ${{ env.NEXT_PUBLIC_API_URL }}
          NEXT_PUBLIC_COGNITO_USER_POOL_ID: ${{ vars.NEXT_PUBLIC_COGNITO_USER_POOL_ID }}
          NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID: ${{ vars.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ vars.VERCEL_ORG_ID }}
          vercel-project-id: ${{ vars.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  notify:
    runs-on: ubuntu-latest
    needs: [deploy-backend, deploy-frontend]
    if: always()
    
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 5. 로컬 개발 환경

### 5.1 개발 서버 스크립트 (`package.json`)
```json
{
  "scripts": {
    "dev": "concurrently \"pnpm dev:frontend\" \"pnpm dev:backend\"",
    "dev:frontend": "cd packages/frontend && next dev",
    "dev:backend": "cd packages/backend && serverless offline",
    "build": "pnpm build:frontend && pnpm build:backend",
    "build:frontend": "cd packages/frontend && next build",
    "build:backend": "cd packages/backend && tsc",
    "lint": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "deploy": "cd packages/infrastructure && cdk deploy",
    "destroy": "cd packages/infrastructure && cdk destroy"
  }
}
```

### 5.2 Docker 개발 환경 (선택사항)
```dockerfile
# Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Expose ports
EXPOSE 3000 3001

# Start development servers
CMD ["pnpm", "dev"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"  # Frontend
      - "3001:3001"  # Backend
    volumes:
      - .:/app
      - /app/node_modules
      - /app/packages/frontend/.next
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    command: pnpm dev

  dynamodb:
    image: amazon/dynamodb-local
    ports:
      - "8000:8000"
    command: ["-jar", "DynamoDBLocal.jar", "-sharedDb", "-inMemory"]
```

---

## 6. 모니터링 및 알림

### 6.1 CloudWatch 알람 설정
```typescript
// packages/infrastructure/lib/monitoring-stack.ts
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'TodoApp Alerts',
    });

    // Email subscription
    alertTopic.addSubscription(
      new subscriptions.EmailSubscription(process.env.ALERT_EMAIL!)
    );

    // Lambda error rate alarm
    const errorRateAlarm = new cloudwatch.Alarm(this, 'LambdaErrorRateAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'Lambda function error rate too high',
    });

    errorRateAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );

    // API Gateway 4xx/5xx alarms
    const apiErrorAlarm = new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: 'API Gateway 5xx error rate too high',
    });

    apiErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );
  }
}
```

### 6.2 로그 집계 및 모니터링
```typescript
// 로그 집계를 위한 Lambda 함수
export const logAggregatorHandler = async (event: any) => {
  // CloudWatch Logs 이벤트 처리
  // 에러 로그 분석 및 알림
  // 메트릭 생성 및 대시보드 업데이트
};
```