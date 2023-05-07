## Code Documentation

### Packages and Dependencies
The code requires the following packages and dependencies to be installed:

- `express`: A web application framework for Node.js
- `sqlite3`: A Node.js driver for SQLite
- `open`: A library for opening SQLite databases
- `bcrypt`: A library for hashing passwords
- `jsonwebtoken`: A library for generating and verifying JSON Web Tokens
- `path`: A Node.js module for working with file paths

Make sure to install these packages using npm or yarn before running the code.

### Database Initialization and Server Setup
The code initializes the SQLite database and starts the Express server. It performs the following steps:

1. It creates a connection to the SQLite database using the `open` function from the `sqlite` package.
2. The database path is defined using the `dbPath` variable, which is set to the path of the "TodoApplication.db" file in the current directory.
3. The Express server is created using the `express` function and stored in the `app` variable.
4. The `express.json()` middleware is added to parse JSON request bodies.
5. The `open` function is called with the database path and the `sqlite3.Database` driver to establish a connection to the database.
6. If the database connection is successful, the server starts listening on port 3005, and a success message is logged to the console.
7. If an error occurs during the database connection, an error message is logged, and the process exits with an error code.

### Authentication Middleware
The code defines an authentication middleware function called `authenticateToken`. This function is used to verify the JSON Web Token (JWT) sent in the request headers. It performs the following steps:

1. It extracts the JWT from the `Authorization` header of the request.
2. If the JWT is not present, it sets the response status to 401 (Unauthorized) and sends an "Invalid JWT Token" error message.
3. If the JWT is present, it verifies the token using the `jwt.verify` function and a secret key ("asdfghjklzxcvbnm").
4. If the token verification fails, it sets the response status to 401 and sends an "Invalid JWT Token" error message.
5. If the token verification succeeds, it extracts the username from the token payload and sets it in the `username` property of the `request` object.
6. It then calls the `next` function to pass control to the next middleware or route handler.

### User Registration API
- **Endpoint**: POST `/register/`
- **Description**: Registers a new user in the system.
- **Request Body**:
  - `name`: The name of the user (string)
  - `username`: The username of the user (string)
  - `password`: The password of the user (string)
- **Response**:
  - If the user is registered successfully, it sends a "User registered successfully" message.
  - If the username is already taken, it sends a 400 (Bad Request) status and an "User already exists" error message.

### User Login API
- **Endpoint**: POST `/login/`
- **Description**: Authenticates a user and generates a JWT token for further authorization.
- **Request Body**:
  - `username`: The username of the user (string)
  - `password`: The password of the user (string)
- **Response**:
  - If the user is authenticated successfully, it sends a JSON object containing the JWT token.
  - If the username is invalid, it sends a 400 (Bad Request) status and an "Invalid username" error message.
  - If the password is invalid, it sends a 400 (Bad Request) status and an "Invalid Password" error message.

### Get all Todos of User based on TodoId
- **Endpoint**: GET `/todos/`
- **Description**: Retrieves all todos for the authenticated user based on their TodoId.
- **Authorization**: Requires a valid JWT token in the request headers.
- **Response**: Sends an array of todo objects representing the user's todos. Each todo object contains the following properties:
  - `todo_id`: The unique identifier of the todo (integer)
  - `user_id`: The user ID of the owner of the todo (integer)
  - `todo`: The description of the todo (string)
  - `priority`: The priority of the todo (integer)
  - `status`: The status of the todo (string)

### Create new Todo based on TodoId
- **Endpoint**: POST `/todos/create/`
- **Description**: Creates a new todo for the authenticated user based on their TodoId.
- **Authorization**: Requires a valid JWT token in the request headers.
- **Request Body**:
  - `todo`: The description of the todo (string)
  - `priority`: The priority of the todo (integer, must be between 1 and 9)
  - `status`: The status of the todo (string, must be one of "COMPLETED", "PENDING", or "CANCELED")
- **Response**:
  - If the todo is created successfully, it sends a "Todo created" message.
  - If the priority is invalid, it sends a 400 (Bad Request) status and a "Priority must be in between 1-9" error message.
  - If the status is invalid, it sends a 400 (Bad Request) status and a "Status should be any of these three: [COMPLETED, PENDING, CANCELED]" error message.

### Get report of Tasks based on UserId
- **Endpoint**: GET `/todos/report/`
- **Description**: Retrieves a report of task counts for the authenticated user based on their UserId.
- **Authorization**: Requires a valid JWT token in the request headers.
- **Response**: Sends an array of count objects representing the task counts. Each count object contains the following properties:
  - `pendings`: The number of pending tasks (integer)
  - `complete`: The number of completed tasks (integer)
  - `cancel`: The number of canceled tasks (integer)
  - `deleted`: The number of deleted tasks (integer)

### Delete todo from table based on UserId
- **Endpoint**: DELETE `/todos/delete/:todoId`
- **Description**: Deletes a todo from the table for the authenticated user based on their UserId and the specified todoId.
- **Authorization**: Requires a valid JWT token in the request headers.
- **URL Parameters**:
  - `todoId`: The ID of the todo to be deleted (integer)
- **Response**:
  - If the todo is deleted successfully, it sends a "Todo Deleted" message.
  - If the todoId is invalid, it sends a 400 (Bad Request) status and an "Invalid todoId" error message.

### Display Sorted Task based on status and UserId
- **Endpoint**: GET `/todos/status/`
- **Description**: Retrieves a list of sorted tasks based on the specified status and the authenticated user's UserId.
- **Authorization**: Requires a valid JWT token in the request headers.
- **Request Body**:
  - `status`: The status of the tasks to be retrieved (string)
- **Response**: Sends an array of todo objects representing the sorted tasks. Each todo object contains the following properties:
    - `todo_id`: The unique identifier of the todo (integer)
    - `user_id`: The user ID of the owner of the todo (integer)
    - `todo`: The description of the todo (string)
    - `priority`: The priority of the todo (integer)
    - `status`: The status of the todo (string)

### Update Todo status based on UserId
- **Endpoint**: PUT `/todos/status/update/:todoId`
- **Description**: Updates the status of a todo for the authenticated user based on their UserId and the specified todoId.
- **Authorization**: Requires a valid JWT token in the request headers.
- **URL Parameters**:
  - `todoId`: The ID of the todo to be updated (integer)
- **Request Body**:
  - `status`: The new status for the todo (string)
- **Response**:
  - If the todo status is updated successfully, it sends a "Todo status updated" message.
  - If the todoId is invalid, it sends a 400 (Bad Request) status and an "Invalid todoId" error message.