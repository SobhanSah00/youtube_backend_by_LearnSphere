# 📘 Backend Concepts – Personal Notes

---


## ✅ What is CORS?

**CORS** stands for **Cross-Origin Resource Sharing**.  
It is a **security feature built into browsers** that restricts web pages from making requests to a different domain than the one that served the web page.

### 📌 Why is CORS Needed?
- By default, browsers block **cross-origin HTTP requests** to protect user data.
- Example: 
  - Frontend: `http://localhost:3000`
  - Backend: `http://localhost:5000`
  - This causes a CORS error unless the backend **explicitly allows** the frontend origin.

### Code Snippet
``` js    
    const cors = require('cors');

    // Allow all origins
    app.use(cors());

    // OR restrict to a specific origin
    app.use(cors({
    origin: 'http://localhost:3000'
    or
    origin: * // it means like the all incoming request are comming from any web browser
    }));
``` 


## ✅ What is cookie-parser?

**cookie-parser** is a middleware for **Express** that helps you **parse cookies** sent with incoming requests.

### 📌 Why is cookie-parser needed?
- Browsers send cookies with HTTP requests.
- **cookie-parser** makes it easy to **access and decode** those cookies in your Express app.

## ✅ What is body-parser?

**body-parser** body-parser is middleware used to parse the incoming request bodies, such as **JSON** or **URL-encoded data**, before reaching your route handlers.

*Note*: As of **Express 4.16+**, you can use built-in methods **(express.json() and express.urlencoded())** instead of installing body-parser.

## ✅some imp concept
In ***Express.js***, the **.on()** function is used to listen for events on an object
### code snipeet
``` js
    // if any error is comming then show the err and message of the error  
    app.on("error", (error) => {
        console.log("ERROR", error);
        throw error;
    });
```

``` js
    // Using .on() to listen to the 'close' event on the server
    app.on('close', () => {
        console.log('Server is closing');
    });
```

``` js
    //req.on('data') listens for data chunks sent in the request body (useful in streams or large payloads).
    app.get('/', (req, res) => {
        req.on('data', (chunk) => {
            console.log(`Received chunk: ${chunk}`);
        });

        res.send('Hello World!');
    });

```
## 📌 EventEmitter in Node.js

 **EventEmitter** is a class provided by Node.js in the events module. It allows you to:
 - Emit named events.
 - Listen and respond to those events asynchronously.
This is very useful for building **decoupled systems**, where components communicate via events instead of calling each other directly.

### decoupled systems :
A ***decoupled system*** is a system where components or modules are independent of each other — they do not directly depend on the internal workings of other parts. Instead, they communicate through well-defined interfaces, like events, APIs, or messages.

### Tightly Coupled v/s deCoupled

#### ❌ Tightly Coupled:
``` js
    function handleOrder(item) {
        sendEmail(item); // Direct dependency
        updateDatabase(item);
    }
```
**handleOrder()** directly depends on **sendEmail()** and **updateDatabase()**.

#### ✅ Decoupled with EventEmitter:
``` js
    const EventEmitter = require('events');
    const emitter = new EventEmitter();

    emitter.on('orderPlaced', sendEmail);
    emitter.on('orderPlaced', updateDatabase);

    function handleOrder(item) {
        emitter.emit('orderPlaced', item); // Just emits an event
    }
```
- **handleOrder()** just emits an event — it doesn’t care who listens.
- **sendEmail** and **updateDatabase** are separate listeners.

### 📦 How to Use EventEmitter

#### 1.create the instance of event emmiter
``` js
    const EventEmitter = require('events');
    const myEmitter = new EventEmitter();
```
#### 2. Register (Listen) for an Event using .on()
``` js
    myEmitter.on('greet', () => {
    console.log('Hello from EventEmitter!');
    });
```
#### 3. Emit the Event
``` js
    myEmitter.emit('greet');
```

### 📌 More Useful Methods of EventEmitter
| Method                             | Description                       |
| ---------------------------------- | --------------------------------- |
| `.on(event, callback)`             | Register a listener for an event  |
| `.emit(event, [args])`             | Trigger an event and pass data    |
| `.once(event, callback)`           | Listen for an event only once     |
| `.removeListener(event, callback)` | Remove a specific listener        |
| `.removeAllListeners(event)`       | Remove all listeners for an event |

## ✅DOTENV
**dotenv** is a Node.js package that loads environment variables from a .env file into process.env.___

This helps you manage configuration and sensitive data (like API keys, database URLs, secret tokens) outside your source code.

This helps also , if anything change in env then update fasterly and distiribute in all other page or module

## 🔐What is bcrypt?

``bcrypt`` is a **password-hashing library** used to securely store passwords by converting them into hashed values.
It helps protect user passwords even if your database is compromised.

### Hash Password
``` js
    const bcrypt = require('bcrypt');
    const plainPassword = 'mySecret123';
    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    console.log(hashedPassword);  // Store this in your database
```
### Check Correct or not password
``` js
    const isMatch = await bcrypt.compare('mySecret123', hashedPassword);
```

## important Code
Before store to the database check any password is chnaged or not , if not then hash that or skip, after this **next()** whatever there we called becaues in next is middleware part , after this part solved then we do the next word .

like that if we want some work , before store the database or any operation do some work something with the data then wrote like this 
***userSchema.pre("save", async function(next))*** , by the help of **pre** we work with the data 
``` js
    userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next()
        // here "this" reffers to the document being saved 
        // hash password
        this.password = await bcrypt.hash(this.password, 10)
        next()
    })
```

### 🎯if we want to create some function inside the mongoose model then do like this 
- use this ***userSchema.methods***, after this wrote any function 

- In Mongoose, the **userSchema.methods** object allows you to define instance methods on a model. These methods are available to all instances (documents) of the model.

#### lets's understand with a example
if we need to create **accessToken** and **refreshToken** then we do like this

``` js
    userSchema.methods.generateAccesstoken = function() {
        return jwt.sign(
            {
                _id: this._id,
                email : this.email,
                username : this.username,
                fullName : this.fullName,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn : process.env.ACCESS_TOKEN_EXPIRY
            }
        )
    }
```

🔑 Why We Write This Code
1. Centralize Logic for Token Generation
By placing the token generation logic inside the Mongoose schema, you can reuse it across different parts of your application, maintaining the **Single Responsibility Principle (SRP)**. You avoid repeating the same token generation logic throughout your code.

2. Encapsulation and Readability
It keeps your code clean and encapsulates the logic inside the model itself, making it easier to manage and test. Instead of writing the token generation logic in each controller or service, it's done in the model where user-related operations are handled.

3. Simplify Access to JWT
With generateAccessToken defined as a method on the schema, you can easily generate a JWT every time you retrieve a user from the database. It’s a good practice to put this kind of reusable logic into the schema.

## 🔁 What is the Purpose of next() in Express?

In Express.js, `next()` is a built-in function used to:

> **Pass control to the next middleware, route handler, or error handler in the stack.**

---

## 📌 Common Use Cases

### ✅ 1. Move to the Next Middleware
```js
app.use((req, res, next) => {
  console.log('Middleware 1');
  next(); // passes to the next middleware
});

app.use((req, res) => {
  console.log('Middleware 2');
  res.send('Done');
});
```
### ✅ 2. Pass Errors to Error-Handling Middleware
``` js
app.use((req, res, next) => {
  const error = new Error('Something went wrong');
  next(error); // triggers error-handling middleware
});

// Error handler (must have 4 arguments)
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});
```
### ✅ 3. Skip to the Next Route Handler
``` js
app.get('/user', (req, res, next) => {
  if (!req.query.admin) return next(); // skip to next route if not admin
  res.send('Admin User');
});

app.get('/user', (req, res) => {
  res.send('Regular User');
});
```
| Expression      | Description                                   |
| --------------- | --------------------------------------------- |
| `next()`        | Pass control to the next middleware or route  |
| `next('route')` | Skip to the next route handler (specific use) |
| `next(error)`   | Skip to the error-handling middleware         |


# 🔐 Authentication: JWT, Session, and Cookies Explained

This guide clearly explains three core authentication concepts in backend development:

- **JWT (JSON Web Token)**
- **Sessions**
- **Cookies**

Let’s break them down with real-world examples and use cases.

---

## ✅ 1. JSON Web Token (JWT)

### What is JWT?
JWT is a compact, URL-safe token used to securely transmit information between client and server. It is **stateless**, meaning the server does not store the token — verification is done using a secret key.

---

### 🧱 JWT Structure

A JWT has 3 parts, separated by dots (`.`):

```
<Header>.<Payload>.<Signature>
```

**1. Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**2. Payload:**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "role": "admin",
  "exp": 1715308800
}
```

**3. Signature:**
- Created using HMAC SHA256:
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

---

### 🔄 How JWT Auth Works:

1. **Login**: User submits email & password.
2. **Generate JWT**: Server verifies and returns JWT token.
3. **Store Token**: Stored in memory, `localStorage`, or secure `HttpOnly` cookie.
4. **Use Token**: Sent with every request via `Authorization` header:
   ```
   Authorization: Bearer <token>
   ```
5. **Verify Token**: Server verifies using a secret/private key.

---

### 🔑 Token Types:
- **Access Token** – Short-lived (e.g., 15 mins)
- **Refresh Token** – Long-lived (e.g., 7 days)

### 🔐 Refresh Flow:
- When access token expires, send refresh token (from cookie or memory) to get a new access token.
- Prevents frequent logins and improves UX.

---

### ✅ Benefits:
- Stateless → scalable for distributed systems
- Self-contained (includes user info)
- Fast and lightweight

### ⚠️ Cautions:
- Must secure token storage (use `HttpOnly` cookies)
- Handle token expiration & revocation properly

---

## 🧠 2. Sessions

### What is a Session?
A session stores user login data **on the server**, and the browser only stores a `session ID` in a cookie.

### 🔄 Session Auth Flow:

1. **Login**: User provides credentials
2. **Session Created**: Server stores session data (`req.session.user = {...}`)
3. **Cookie Sent**: Client receives a cookie like:
   ```
   connect.sid=abc123
   ```
4. **Request Handling**: Server uses session ID to retrieve user info.

---

### ✅ Benefits:
- Simple to implement
- Auto-expiration and server-side control

### ⚠️ Drawbacks:
- Not stateless
- Requires external store (Redis/DB) in production
- Scaling is harder than JWT

---

## 🍪 3. Cookies

### What is a Cookie?
A small data piece stored in the browser and auto-sent on each request to the origin domain.

---

### 🔄 How Cookies Work in Auth:

1. Server sets cookie after login:
```js
res.cookie("accessToken", token, {
  httpOnly: true,     // JS cannot access
  secure: true,       // HTTPS only
  sameSite: "Strict", // Prevent CSRF
  maxAge: 15 * 60 * 1000 // 15 minutes
});
```

2. Browser sends cookie on each request:
```
Cookie: accessToken=xyz123
```

---

### ✅ Benefits:
- Great for storing JWT securely
- Auto-handled by browser

### ⚠️ Risks:
- Vulnerable to CSRF (use `SameSite`)
- Requires HTTPS for secure cookies

---

## 🔁 JWT vs Session vs Cookie – Comparison

| Feature          | JWT                    | Session                 | Cookie                      |
|------------------|-------------------------|--------------------------|------------------------------|
| Stored on        | Client                 | Server                  | Client (Browser)             |
| Stateless        | ✅ Yes                 | ❌ No                   | Depends                      |
| Auto-sent?       | ❌ No (add manually)   | ✅ via cookie           | ✅ via cookie                |
| Scalability      | ✅ Easy                | ❌ Needs external store | ✅ Easy                      |
| Secure Storage   | Use `HttpOnly` cookie  | Stored on server        | Use `HttpOnly`, `Secure`    |

---

## 📌 Summary

- **JWT** is ideal for scalable APIs & microservices (stateless, fast).
- **Session** is simple for monolithic or traditional web apps.
- **Cookies** are just a transport method — use wisely with JWT or session IDs.

---




## 🖥 MONGODB ALL OPERATION 

```findOne()``` :  **is used to find a single document that matches a query. It returns the first matching document only.**

### ✅ Syntax
``` js 
db.collection.findOne(query)
```

``` js
[
  { "name": "Alice", "age": 25 },
  { "name": "Bob", "age": 30 },
  { "name": "Charlie", "age": 35 }
]

db.users.findOne({ age: 30 }); // returns Bob and their full record
```

``` js
[
  { "name": "Alice", "age": 25 },
  { "name": "Charlie", "age": 30 },
  { "name": "Bob", "age": 30 }
]

db.users.findOne({ age: 30 }); // returns Charlie and their full record
// here u can see like there are 2 people whose age is 30 , it reuturn only Charlie , because it only return 1st record who match that particular thing ...
```

`or()`: **Match documents where at least one of the specified conditions is true.**

### ✅ Syntax

```js
db.collection.find({
  $or: [
    { field1: value1 },
    { field2: value2 }
  ]
});
```
``` js
User.findOne({
    $or: [{ email }, { username }],
  })
```

`create()` : **create record or document in database .**

### ✅ Syntax
``` js
db.collection.create({
    ...
})
```

``` js
await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });
```
`.select()` : before send the data we need to remove some important informatioin that can we do by the help of this method

### ✅ Example
``` js
const created_user = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // it removes the password and refreshToken before we send or return the data
```

`findById()` : From Id it returns the whole record , it takes mongodb generated id , or if u create in schema id
``` js
await User.findById(user._id)
// return that particular user
```

`find()` : Retrieve all documents that match a given query.

### ✅ Syntax
``` js
User.find({ query });
```
``` js
[
  { "name": "Bob", "age": 30 },
  { "name": "Charlie", "age": 30 }
]

db.users.find({ age: 30 });

//return Bob and Charlie whole record
```

`save()` : This method is used to **store or update a document** in MongoDB using Mongoose.

### ✅ Use Case:

When you create a new document or change an existing one, you use `.save()` to persist the changes.

```js
const user = new User({
  name: "Alice",
  email: "alice@example.com"
});

await user.save(); // Saves to the database
```

### 🔄 How It Works:

- If the document is **new**, it will be **inserted**.
- If the document already **exists**, it will be **updated**.
- Triggers **middleware/hooks** like:
  - `pre('save')`
  - `post('save')`
- Runs **validation** based on your schema.

### 🛠 Skipping Validation:

```js
await user.save({ validateBeforeSave: false });
```

> ⚠️ Use this only if you're sure the data is safe. It skips schema validation.


🆕 `.insertMany()`
- Inserts multiple documents into the database in a single operation.

```js
User.insertMany([{ name: 'Alice' }, { name: 'Charlie' }]);
```

`.findOneAndUpdate()`
- Finds a document by a query, updates it, and returns the updated document.

```js
const user = await User.findOneAndUpdate(
  { email: 'alice@example.com' },
  { name: 'Alice Updated' },
  { new: true } // returns the updated document
);
```

`.findByIdAndUpdate()`
- Finds a document by its `_id`, updates it, and returns the updated document.

```js
const user = await User.findByIdAndUpdate(
  '60d71b2f6c55b66b29a7b5d8',
  { name: 'Alice Updated' },
  { new: true }
);
```

`.findOneAndDelete()`
- Finds a document and deletes it.

```js
const user = await User.findOneAndDelete({ email: 'alice@example.com' });
```

`.findByIdAndDelete()`
- Finds a document by `_id` and deletes it.

```js
const user = await User.findByIdAndDelete('60d71b2f6c55b66b29a7b5d8');
```

`.updateOne()`
- Updates a single document based on a query.

```js
await User.updateOne({ email: 'alice@example.com' }, { name: 'Alice Updated' });
```

`.updateMany()`
- Updates multiple documents based on a query.

```js
await User.updateMany({ age: { $gt: 30 } }, { $set: { status: 'active' } });
```

`.replaceOne()`
- Replaces a single document with the provided document.

```js
await User.replaceOne({ email: 'alice@example.com' }, { name: 'Alice New' });
```

`.deleteOne()`
- Deletes a single document based on a query.

```js
await User.deleteOne({ email: 'alice@example.com' });
```

`.deleteMany()`
- Deletes multiple documents based on a query.

```js
await User.deleteMany({ age: { $lt: 20 } });
```

