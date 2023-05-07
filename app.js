const express = require("express");
const sqlite3 = require("sqlite3");
const {open} = require("sqlite");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const { error } = require("console");

const dbPath = path.join(__dirname, "TodoApplication.db");
const app = express();
app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        app.listen(3005, () => {
            console.log("Server running at http://localhost:3005");
        });
    } catch (e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
};
initializeDBAndServer();

// authenticating user
const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeaders = request.headers['authorization'];
    if (authHeaders !== undefined) {
        jwtToken = authHeaders.split(" ")[1];
    }
    if (jwtToken === undefined) {
        response.status(401);
        response.send("Invalid JWT Token");
    } else {
        jwt.verify(jwtToken, "asdfghjklzxcvbnm", async (error, payload) => {
            if(error){
                response.status(401);
                response.send("Invalid JWT Token");
            } else {
                request.username = payload.username;
                next();
            }
        });
    }
};

// User Register API
app.post("/register/", async (request, response) => {
    const {name, username, password} = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectDBQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await db.get(selectDBQuery);
    if(dbUser === undefined){
        const registerUserQuery = `
            INSERT INTO user(name, username, password)
            VALUES ('${name}', '${username}', '${hashedPassword}');
        `;
        await db.run(registerUserQuery);
        response.send("User registered successully");
    } else {
        response.status(400);
        response.send("user already exists");
    }
})

// User Login API
app.post("/login/", async (request, response) => {
    const {username, password} = request.body;
    const userLoginQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const dbUser = await db.get(userLoginQuery);
    if(dbUser === undefined){
        response.status(400);
        response.send("Invalid username");
    } else {
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
        if(isPasswordMatched === false) {
            response.status(400);
            response.send("Invalid Password");
        } else {
            const payload = {
                username: username
            };
            const jwtToken = jwt.sign(payload, "asdfghjklzxcvbnm");
            response.send({jwtToken});
        }
    }
})

let userId = null;  // userId identifier has user id of a user which is unique, it is generated when user login

// Get all Todos of User based on TodoId
app.get("/todos/", authenticateToken, async (request, response) => {
    const username = request.username;
    const selectUserQuery = `SELECT id FROM user WHERE username = '${username}';`;
    const dbUser = await db.get(selectUserQuery);
    userId = dbUser.id;
    const getTodosQuery = `SELECT * FROM todo WHERE user_id = ${dbUser.id} ORDER BY priority DESC;`;
    const todoArray = await db.all(getTodosQuery);
    response.send(todoArray);
})

// create new Todo based on TodoId
app.post("/todos/create/", authenticateToken, async (request, response) => {
    const {todo, priority, status} = request.body;
    if(priority<1 || priority>9) {
        response.status(400);
        response.send("Priority must be in between 1-9");
        return;
    }else if(status !== "COMPLETED" && status !== "PENDING" && status !== "CANCELED"){
        response.status(400);
        response.send("Status Should be any of them from these three [COMPLETED, PENDING, CANCELED]");
        return;
    } else{
        const postTodoQuery = `
            INSERT INTO todo (user_id, todo, priority, status)
            VALUES (${userId}, '${todo}', ${priority}, '${status}');
        `;
        await db.run(postTodoQuery);
        response.send("Todo created");
    }
})

// Get report of Tasks based on UserId
app.get("/todos/report/", authenticateToken, async (request, response) => {
    const countOfPendingQuery = `SELECT count(*) AS pendings FROM todo WHERE user_id = ${userId} and status = "PENDING";`;
    const countOfPending = await db.get(countOfPendingQuery);
    const countOfCompletedQuery = `SELECT count(*) AS complete FROM todo WHERE user_id = ${userId} and status = "COMPLETED";`;
    const countOfCompleted = await db.get(countOfCompletedQuery);
    const countOfCanceledQuery = `SELECT count(*) AS cancel FROM todo WHERE user_id = ${userId} and status = "CANCELED";`;
    const countOfCanceled = await db.get(countOfCanceledQuery);
    const countOfDeletedQuery = `SELECT count(*) AS deleted FROM deleted_todos WHERE user_id = ${userId};`;
    const countOfDeleted = await db.get(countOfDeletedQuery);
    const count = [
        countOfPending, countOfCompleted, countOfCanceled, countOfDeleted
    ];
    response.send(count);
})

// Delete todo from table based on UserId
app.delete("/todos/delete/:todoId", authenticateToken, async (request, response) => {
    const {todoId} = request.params;
    const selectTodoQuery = `SELECT * FROM todo WHERE user_id = ${userId} and todo_id = ${todoId};`;
    const todoItem = await db.get(selectTodoQuery);
    if(todoItem === undefined){
        response.status(400);
        response.send("Invalid todoId");
    } else{
        const updateToDeleteTodoTableQuery = `
            INSERT INTO deleted_todos (user_id, todo, priority)
            VALUES (${todoItem.user_id}, '${todoItem.todo}', ${todoItem.priority});
        `;
        await db.run(updateToDeleteTodoTableQuery);
        const deleteTodoQuery = `DELETE FROM todo WHERE todo_id = ${todoId} and user_id = ${userId}`;
        await db.run(deleteTodoQuery);
        response.send("Todo Deleted");
    }
})

// Display Sorted Task based on status and UserId
app.get("/todos/status/", authenticateToken, async (request, response) => {
    const {status} = request.body;
    const getTodoBasedOnStatusQuery = `
        SELECT * FROM todo WHERE status = '${status}' AND user_id = ${userId} ORDER BY priority ASC;
    `;
    const todoArray = await db.all(getTodoBasedOnStatusQuery);
    response.send(todoArray);
})

// Update Todo status based on UserId
app.put("/todos/status/update/:todoId", authenticateToken, async (request, response) => {
    const {todoId} = request.params;
    const {status} = request.body;
    const selectTodoQuery = `SELECT * FROM todo WHERE user_id = ${userId} and todo_id = ${todoId};`;
    const todoItem = await db.get(selectTodoQuery);
    if(todoItem === undefined){
        response.status(400);
        response.send("Invalid todoId");
    } else {
        const updateStatusQuery = `
            UPDATE todo SET status = '${status}' WHERE todo_id = ${todoId} AND user_id = ${userId};
        `;
        await db.run(updateStatusQuery);
        response.send("Todo status updated");
    }
})