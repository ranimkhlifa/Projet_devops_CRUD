const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());
app.use(cors());
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'User API',
            version: '1.0.0',
            description: 'API documentation for the management of posts',
        },
        servers: [
            {
                url: 'http://localhost:4001', // Corrected port
                description: 'Local server',
            },
        ],
    },
    apis: ['./app.js'],
};


// Initialize Swagger-jsdoc
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Create a connection pool to the PostgreSQL database
const pool = new Pool({
    host: "localhost",
    user: "postgres", // Replace with your PostgreSQL username
    password: "ranim11ranim11", // Replace with your PostgreSQL password
    database: "postsDEVOPS", // Replace with your database name
    port: 5432, // Default PostgreSQL port
});

pool.connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch((err) => console.error("Error connecting to PostgreSQL", err));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Retrieve all posts
 *     responses:
 *       200:
 *         description: A list of posts
 */
app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM posts");
        res.send(result.rows);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ error: "Failed to fetch posts" });
    }
});

/**
 * @swagger
 * /create:
 *   post:
 *     summary: Create a new post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the post
 *               content:
 *                 type: string
 *                 description: The content of the post
 *               description:
 *                 type: string
 *                 description: A brief description of the post
 *               dateCreation:
 *                 type: string
 *                 format: date-time
 *                 description: The creation date of the post in ISO 8601 format
 *     responses:
 *       200:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 post:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     description:
 *                       type: string
 *                     dateCreation:
 *                       type: string
 *                       format: date-time
 */

app.post('/create', async (req, res) => {
    const data = req.body;
    try {
        // SQL query to insert a new post
        const query = `
            INSERT INTO posts (title, content, description, dateCreation) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`;
        
        // Map data from the request body
        const values = [data.title, data.content, data.description, data.dateCreation]; // Ensure all fields are provided

        const result = await pool.query(query, values); // Execute query
        res.send({ msg: 'Post Added', post: result.rows[0] }); // Respond with the new post
    } catch (error) {
        console.error("Error adding post:", error);
        res.status(500).send({ msg: 'Failed to add post' }); // Handle errors
    }
});


/**
 * @swagger
 * /update/{id}:
 *   put:
 *     summary: Update an existing post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The updated title of the post
 *               content:
 *                 type: string
 *                 description: The updated content of the post
 *               description:
 *                 type: string
 *                 description: The updated description of the post
 *               dateCreation:
 *                 type: string
 *                 format: date-time
 *                 description: The updated creation date of the post in ISO 8601 format
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 post:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     description:
 *                       type: string
 *                     dateCreation:
 *                       type: string
 *                       format: date-time
 */

app.put("/update/:id", async (req, res) => {
    const id = req.params.id; // Extract post ID from URL
    const data = req.body; // Extract updated data from the request body

    try {
        // SQL query to update a post
        const query = `
            UPDATE posts 
            SET title = $1, content = $2, description = $3, dateCreation = $4
            WHERE id = $5 
            RETURNING *`;
        
        // Map data from the request body
        const values = [data.title, data.content, data.description, data.dateCreation, id];

        const result = await pool.query(query, values); // Execute the query
        if (result.rows.length === 0) {
            return res.status(404).send({ msg: "Post not found" }); // Handle missing post
        }

        res.send({ msg: "Post Updated", post: result.rows[0] }); // Respond with updated post
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).send({ msg: "Failed to update post" }); // Handle server errors
    }
});


/**
 * @swagger
 * /delete/{id}:
 *   delete:
 *     summary: Delete a post by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the post to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 */


app.delete("/delete/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const query = "DELETE FROM posts WHERE id = $1 RETURNING *";
        const values = [id];

        const result = await pool.query(query, values);
        res.send({ msg: "Post Deleted", post: result.rows[0] });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).send({ msg: "Failed to delete post" });
    }
});


/**
 * @swagger
 * /users/create:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User created successfully
 */


///////////////////-------------------user--------------/////////////////////////////////

app.post("/users/create", async (req, res) => {
    const { nom, prenom, email, address, password } = req.body;
    try {
        const query = `
            INSERT INTO users (nom, prenom, email, address, password) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`;
        const values = [nom, prenom, email, address, password];

        const result = await pool.query(query, values);
        res.send({ msg: "User Created", user: result.rows[0] });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).send({ msg: "Failed to create user" });
    }
});


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve all users
 *     responses:
 *       200:
 *         description: A list of users
 */



app.get("/users", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.send(result.rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send({ msg: "Failed to fetch users" });
    }
});

/**
 * @swagger
 * /users/update/{id}:
 *   put:
 *     summary: Update an existing user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */


app.put("/users/update/:id", async (req, res) => {
    const id = req.params.id;
    const { nom, prenom, email, address, password } = req.body;

    try {
        const query = `
            UPDATE users 
            SET nom = $1, prenom = $2, email = $3, address = $4, password = $5 
            WHERE id = $6 
            RETURNING *`;
        const values = [nom, prenom, email, address, password, id];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).send({ msg: "User not found" });
        }

        res.send({ msg: "User Updated", user: result.rows[0] });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send({ msg: "Failed to update user" });
    }
});

/**
 * @swagger
 * /users/delete/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 */


app.delete("/users/delete/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const query = "DELETE FROM users WHERE id = $1 RETURNING *";
        const values = [id];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).send({ msg: "User not found" });
        }

        res.send({ msg: "User Deleted", user: result.rows[0] });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).send({ msg: "Failed to delete user" });
    }
});

app.listen(4001, () => {
    console.log("Server running on http://localhost:4001");
    console.log("Swagger docs available at http://localhost:4001/api-docs");
});

