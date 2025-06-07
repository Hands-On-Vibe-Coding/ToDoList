# 백엔드 설계

## 개요
이 문서는 AWS Lambda 기반 백엔드 서비스의 아키텍처, 비즈니스 로직, 그리고 인프라 구성을 정의합니다.

---

## 1. Lambda 함수 구조

```
packages/backend/src/
├── handlers/              # Lambda 핸들러
│   ├── auth/
│   │   ├── signin.ts
│   │   ├── signup.ts
│   │   ├── refresh.ts
│   │   └── me.ts
│   └── todos/
│       ├── list.ts
│       ├── create.ts
│       ├── get.ts
│       ├── update.ts
│       ├── delete.ts
│       └── updateStatus.ts
├── services/             # 비즈니스 로직
│   ├── auth.service.ts
│   └── todo.service.ts
├── repositories/         # 데이터 접근 계층
│   ├── user.repository.ts
│   └── todo.repository.ts
├── middleware/           # 미들웨어
│   ├── auth.ts
│   ├── validation.ts
│   └── cors.ts
├── utils/               # 유틸리티
│   ├── errorHandler.ts
│   ├── response.ts
│   └── logger.ts
└── types/               # 타입 정의
    ├── auth.ts
    ├── todo.ts
    └── lambda.ts
```

---

## 2. Lambda 핸들러 구현

### 2.1 인증 핸들러

**회원가입 핸들러 (`handlers/auth/signup.ts`)**
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { handleLambdaError } from '../../utils/errorHandler';
import { validateInput } from '../../middleware/validation';
import { authSchema } from '../../middleware/validation';
import { AuthService } from '../../services/auth.service';
import { createSuccessResponse } from '../../utils/response';

const authService = new AuthService();

export const handler: APIGatewayProxyHandler = handleLambdaError(
  validateInput(authSchema)(
    async (event, context) => {
      const { email, password, name } = event.validatedBody;

      const result = await authService.signup({
        email,
        password,
        name
      });

      return createSuccessResponse(result, 201);
    }
  )
);
```

**로그인 핸들러 (`handlers/auth/signin.ts`)**
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { handleLambdaError } from '../../utils/errorHandler';
import { validateInput } from '../../middleware/validation';
import { AuthService } from '../../services/auth.service';
import { createSuccessResponse } from '../../utils/response';

const authService = new AuthService();

export const handler: APIGatewayProxyHandler = handleLambdaError(
  validateInput(z.object({
    email: z.string().email(),
    password: z.string().min(1)
  }))(
    async (event, context) => {
      const { email, password } = event.validatedBody;

      const result = await authService.signin({
        email,
        password
      });

      return createSuccessResponse(result);
    }
  )
);
```

### 2.2 ToDo 핸들러

**ToDo 목록 조회 핸들러 (`handlers/todos/list.ts`)**
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { handleLambdaError } from '../../utils/errorHandler';
import { authMiddleware } from '../../middleware/auth';
import { TodoService } from '../../services/todo.service';
import { createSuccessResponse } from '../../utils/response';

const todoService = new TodoService();

export const handler: APIGatewayProxyHandler = handleLambdaError(
  authMiddleware(
    async (event, context) => {
      const userId = event.user.id;
      const queryParams = event.queryStringParameters || {};

      const params = {
        page: parseInt(queryParams.page || '1'),
        limit: parseInt(queryParams.limit || '20'),
        status: queryParams.status,
        priority: queryParams.priority,
        search: queryParams.search,
        sortBy: queryParams.sortBy || 'createdAt',
        sortOrder: queryParams.sortOrder || 'desc'
      };

      const result = await todoService.getTodos(userId, params);

      return createSuccessResponse(result);
    }
  )
);
```

**ToDo 생성 핸들러 (`handlers/todos/create.ts`)**
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { handleLambdaError } from '../../utils/errorHandler';
import { authMiddleware } from '../../middleware/auth';
import { validateInput } from '../../middleware/validation';
import { createTodoSchema } from '../../middleware/validation';
import { TodoService } from '../../services/todo.service';
import { createSuccessResponse } from '../../utils/response';

const todoService = new TodoService();

export const handler: APIGatewayProxyHandler = handleLambdaError(
  authMiddleware(
    validateInput(createTodoSchema)(
      async (event, context) => {
        const userId = event.user.id;
        const { title, description, priority } = event.validatedBody;

        const result = await todoService.createTodo({
          userId,
          title,
          description,
          priority
        });

        return createSuccessResponse(result, 201);
      }
    )
  )
);
```

---

## 3. 서비스 레이어

### 3.1 인증 서비스 (`services/auth.service.ts`)
```typescript
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../utils/errorHandler';
import { hashPassword, comparePassword } from '../utils/crypto';
import { generateTokens } from '../utils/jwt';

export class AuthService {
  private userRepository: UserRepository;
  private cognitoClient: CognitoIdentityServiceProvider;

  constructor() {
    this.userRepository = new UserRepository();
    this.cognitoClient = new CognitoIdentityServiceProvider();
  }

  async signup(data: {
    email: string;
    password: string;
    name: string;
  }) {
    // 기존 사용자 확인
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'Email already exists');
    }

    // Cognito에서 사용자 생성
    const cognitoUser = await this.createCognitoUser(data);
    
    // DynamoDB에 사용자 정보 저장
    const user = await this.userRepository.create({
      id: cognitoUser.UserSub,
      email: data.email,
      name: data.name
    });

    // JWT 토큰 생성
    const tokens = generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      tokens
    };
  }

  async signin(data: {
    email: string;
    password: string;
  }) {
    // Cognito 인증
    const cognitoResponse = await this.authenticateWithCognito(data);
    
    // 사용자 정보 조회
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // JWT 토큰 생성
    const tokens = generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      tokens
    };
  }

  async refreshToken(refreshToken: string) {
    // JWT 토큰 검증 및 갱신
    const { userId } = verifyRefreshToken(refreshToken);
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const newTokens = generateTokens(userId);
    return {
      accessToken: newTokens.accessToken,
      expiresIn: newTokens.expiresIn
    };
  }

  private async createCognitoUser(data: {
    email: string;
    password: string;
    name: string;
  }) {
    try {
      const params = {
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: data.email,
        TemporaryPassword: data.password,
        MessageAction: 'SUPPRESS',
        UserAttributes: [
          { Name: 'email', Value: data.email },
          { Name: 'name', Value: data.name },
          { Name: 'email_verified', Value: 'true' }
        ]
      };

      const result = await this.cognitoClient.adminCreateUser(params).promise();
      
      // 영구 비밀번호 설정
      await this.cognitoClient.adminSetUserPassword({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: data.email,
        Password: data.password,
        Permanent: true
      }).promise();

      return result.User!;
    } catch (error) {
      throw new AppError(400, 'COGNITO_ERROR', error.message);
    }
  }

  private async authenticateWithCognito(data: {
    email: string;
    password: string;
  }) {
    try {
      const params = {
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        ClientId: process.env.COGNITO_CLIENT_ID!,
        AuthParameters: {
          USERNAME: data.email,
          PASSWORD: data.password
        }
      };

      const result = await this.cognitoClient.adminInitiateAuth(params).promise();
      return result.AuthenticationResult!;
    } catch (error) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
  }
}
```

### 3.2 ToDo 서비스 (`services/todo.service.ts`)
```typescript
import { TodoRepository } from '../repositories/todo.repository';
import { AppError } from '../utils/errorHandler';
import { ulid } from 'ulid';

export class TodoService {
  private todoRepository: TodoRepository;

  constructor() {
    this.todoRepository = new TodoRepository();
  }

  async getTodos(userId: string, params: {
    page: number;
    limit: number;
    status?: string;
    priority?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  }) {
    const todos = await this.todoRepository.findByUserId(userId, params);
    const total = await this.todoRepository.countByUserId(userId, params);

    const hasMore = params.page * params.limit < total;

    return {
      todos,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        hasMore
      }
    };
  }

  async createTodo(data: {
    userId: string;
    title: string;
    description?: string;
    priority: 'high' | 'medium' | 'low';
  }) {
    const todoId = ulid();
    
    const todo = await this.todoRepository.create({
      id: todoId,
      userId: data.userId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: 'pending'
    });

    return { todo };
  }

  async getTodo(userId: string, todoId: string) {
    const todo = await this.todoRepository.findById(todoId);
    
    if (!todo) {
      throw new AppError(404, 'TODO_NOT_FOUND', 'Todo not found');
    }

    if (todo.userId !== userId) {
      throw new AppError(403, 'TODO_ACCESS_DENIED', 'Access denied');
    }

    return { todo };
  }

  async updateTodo(userId: string, todoId: string, data: {
    title?: string;
    description?: string;
    priority?: 'high' | 'medium' | 'low';
    status?: 'pending' | 'in-progress' | 'completed';
  }) {
    const existingTodo = await this.todoRepository.findById(todoId);
    
    if (!existingTodo) {
      throw new AppError(404, 'TODO_NOT_FOUND', 'Todo not found');
    }

    if (existingTodo.userId !== userId) {
      throw new AppError(403, 'TODO_ACCESS_DENIED', 'Access denied');
    }

    const updatedTodo = await this.todoRepository.update(todoId, data);

    return { todo: updatedTodo };
  }

  async deleteTodo(userId: string, todoId: string) {
    const existingTodo = await this.todoRepository.findById(todoId);
    
    if (!existingTodo) {
      throw new AppError(404, 'TODO_NOT_FOUND', 'Todo not found');
    }

    if (existingTodo.userId !== userId) {
      throw new AppError(403, 'TODO_ACCESS_DENIED', 'Access denied');
    }

    await this.todoRepository.delete(todoId);

    return { message: 'Todo deleted successfully' };
  }

  async updateTodoStatus(userId: string, todoId: string, status: 'pending' | 'in-progress' | 'completed') {
    return this.updateTodo(userId, todoId, { status });
  }
}
```

---

## 4. 레포지토리 레이어

### 4.1 사용자 레포지토리 (`repositories/user.repository.ts`)
```typescript
import { DynamoDB } from 'aws-sdk';
import { User } from '../types/auth';

export class UserRepository {
  private dynamodb: DynamoDB.DocumentClient;
  private tableName: string;

  constructor() {
    this.dynamodb = new DynamoDB.DocumentClient();
    this.tableName = process.env.USERS_TABLE_NAME!;
  }

  async create(user: {
    id: string;
    email: string;
    name: string;
  }): Promise<User> {
    const now = new Date().toISOString();
    
    const item = {
      PK: `USER#${user.id}`,
      SK: 'PROFILE',
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: now,
      updatedAt: now
    };

    await this.dynamodb.put({
      TableName: this.tableName,
      Item: item,
      ConditionExpression: 'attribute_not_exists(PK)'
    }).promise();

    return {
      id: item.id,
      email: item.email,
      name: item.name,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.dynamodb.get({
      TableName: this.tableName,
      Key: {
        PK: `USER#${id}`,
        SK: 'PROFILE'
      }
    }).promise();

    if (!result.Item) {
      return null;
    }

    return {
      id: result.Item.id,
      email: result.Item.email,
      name: result.Item.name,
      createdAt: result.Item.createdAt,
      updatedAt: result.Item.updatedAt
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.dynamodb.query({
      TableName: this.tableName,
      IndexName: 'EmailIndex', // GSI
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }).promise();

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    const item = result.Items[0];
    return {
      id: item.id,
      email: item.email,
      name: item.name,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  async update(id: string, updates: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
    const now = new Date().toISOString();
    
    const updateExpression = [];
    const expressionAttributeValues: any = {
      ':updatedAt': now
    };
    
    if (updates.name) {
      updateExpression.push('name = :name');
      expressionAttributeValues[':name'] = updates.name;
    }
    
    if (updates.email) {
      updateExpression.push('email = :email');
      expressionAttributeValues[':email'] = updates.email;
    }

    const result = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        PK: `USER#${id}`,
        SK: 'PROFILE'
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}, updatedAt = :updatedAt`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }).promise();

    const item = result.Attributes!;
    return {
      id: item.id,
      email: item.email,
      name: item.name,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}
```

### 4.2 ToDo 레포지토리 (`repositories/todo.repository.ts`)
```typescript
import { DynamoDB } from 'aws-sdk';
import { Todo } from '../types/todo';

export class TodoRepository {
  private dynamodb: DynamoDB.DocumentClient;
  private tableName: string;

  constructor() {
    this.dynamodb = new DynamoDB.DocumentClient();
    this.tableName = process.env.TODOS_TABLE_NAME!;
  }

  async create(todo: {
    id: string;
    userId: string;
    title: string;
    description?: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in-progress' | 'completed';
  }): Promise<Todo> {
    const now = new Date().toISOString();
    
    const item = {
      PK: `USER#${todo.userId}`,
      SK: `TODO#${todo.id}`,
      todoId: todo.id,
      userId: todo.userId,
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      status: todo.status,
      createdAt: now,
      updatedAt: now
    };

    await this.dynamodb.put({
      TableName: this.tableName,
      Item: item
    }).promise();

    return {
      id: item.todoId,
      userId: item.userId,
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  async findByUserId(userId: string, params: {
    page: number;
    limit: number;
    status?: string;
    priority?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  }): Promise<Todo[]> {
    const queryParams: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'TODO#'
      },
      Limit: params.limit,
      ScanIndexForward: params.sortOrder === 'asc'
    };

    // 필터 조건 추가
    const filterExpressions = [];
    
    if (params.status && params.status !== 'all') {
      filterExpressions.push('#status = :status');
      queryParams.ExpressionAttributeValues![':status'] = params.status;
      queryParams.ExpressionAttributeNames = { '#status': 'status' };
    }
    
    if (params.priority && params.priority !== 'all') {
      filterExpressions.push('priority = :priority');
      queryParams.ExpressionAttributeValues![':priority'] = params.priority;
    }
    
    if (params.search) {
      filterExpressions.push('(contains(title, :search) OR contains(description, :search))');
      queryParams.ExpressionAttributeValues![':search'] = params.search;
    }

    if (filterExpressions.length > 0) {
      queryParams.FilterExpression = filterExpressions.join(' AND ');
    }

    // 페이지네이션 처리
    if (params.page > 1) {
      // 실제 구현에서는 LastEvaluatedKey를 사용하여 페이지네이션 구현
      // 여기서는 단순화된 예시
    }

    const result = await this.dynamodb.query(queryParams).promise();

    return (result.Items || []).map(item => ({
      id: item.todoId,
      userId: item.userId,
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
  }

  async findById(id: string): Promise<Todo | null> {
    // 실제로는 GSI를 사용하거나 userId와 함께 조회해야 함
    // 여기서는 단순화된 예시
    const scanParams: DynamoDB.DocumentClient.ScanInput = {
      TableName: this.tableName,
      FilterExpression: 'todoId = :todoId',
      ExpressionAttributeValues: {
        ':todoId': id
      }
    };

    const result = await this.dynamodb.scan(scanParams).promise();

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    const item = result.Items[0];
    return {
      id: item.todoId,
      userId: item.userId,
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  async update(id: string, updates: Partial<Todo>): Promise<Todo> {
    const now = new Date().toISOString();
    
    // 먼저 기존 아이템 조회해서 PK 획득
    const existingTodo = await this.findById(id);
    if (!existingTodo) {
      throw new Error('Todo not found');
    }

    const updateExpression = [];
    const expressionAttributeValues: any = {
      ':updatedAt': now
    };
    
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'userId' && key !== 'createdAt') {
        updateExpression.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = updates[key as keyof Todo];
      }
    });

    const result = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        PK: `USER#${existingTodo.userId}`,
        SK: `TODO#${id}`
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}, updatedAt = :updatedAt`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }).promise();

    const item = result.Attributes!;
    return {
      id: item.todoId,
      userId: item.userId,
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  async delete(id: string): Promise<void> {
    const existingTodo = await this.findById(id);
    if (!existingTodo) {
      throw new Error('Todo not found');
    }

    await this.dynamodb.delete({
      TableName: this.tableName,
      Key: {
        PK: `USER#${existingTodo.userId}`,
        SK: `TODO#${id}`
      }
    }).promise();
  }

  async countByUserId(userId: string, filters: any): Promise<number> {
    // 실제 구현에서는 필터 조건에 맞는 카운트 조회
    // 여기서는 단순화된 예시
    const queryParams: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'TODO#'
      },
      Select: 'COUNT'
    };

    const result = await this.dynamodb.query(queryParams).promise();
    return result.Count || 0;
  }
}
```

---

## 5. 미들웨어

### 5.1 인증 미들웨어 (`middleware/auth.ts`)
```typescript
import { APIGatewayProxyEvent } from 'aws-lambda';
import { AppError } from '../utils/errorHandler';
import { verifyAccessToken } from '../utils/jwt';
import { UserRepository } from '../repositories/user.repository';

const userRepository = new UserRepository();

export const authMiddleware = (handler: Function) => {
  return async (event: APIGatewayProxyEvent, context: any) => {
    try {
      const authHeader = event.headers.Authorization || event.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
      }

      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      
      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw new AppError(401, 'UNAUTHORIZED', 'User not found');
      }

      // 이벤트에 사용자 정보 추가
      (event as any).user = user;

      return await handler(event, context);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token');
    }
  };
};
```

---

## 6. 유틸리티

### 6.1 JWT 유틸리티 (`utils/jwt.ts`)
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

export function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60 // 15 minutes in seconds
  };
}

export function verifyAccessToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return { userId: decoded.userId };
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return { userId: decoded.userId };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}
```

### 6.2 응답 유틸리티 (`utils/response.ts`)
```typescript
import { APIGatewayProxyResult } from 'aws-lambda';

export function createSuccessResponse(
  data: any, 
  statusCode: number = 200
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString()
    })
  };
}

export function createErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: any
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        ...(details && { details })
      }
    })
  };
}
```