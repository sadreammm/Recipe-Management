var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var mysql = require('mysql');
var querystring = require('querystring');
var session = require('./mySession');

// MySQL Connection
var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'recipe_db'
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to MySQL!");

    var createUserTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL
        );
    `;

    con.query(createUserTable, function(err, result) {
        if (err) throw err;
        console.log('Users table created or already exists');
    });
});

// Create HTTP server
http.createServer(function(req, res) {
    var reqUrl = url.parse(req.url, true);
    var pathname = reqUrl.pathname;

    if (pathname === '/' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf-8', function(err, data) {
            if (err) throw err;
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        });
    }

    // Handle GET request for recipes based on category
    else if (pathname === '/recipes' && req.method === 'GET') {
        var category = reqUrl.query.category;
        if (!category) {
            res.writeHead(400);
            res.end('Category parameter is required');
            return;
        }

        let sql = "SELECT * FROM recipes WHERE category like ?";
        con.query(sql, ['%' + category + '%'], function(err, result) {
            if (err) throw err;
            if (result.length === 0) {
                res.writeHead(404);
                res.end('Category not found in the database');
                return;
            }
            fs.readFile(path.join(__dirname, 'public', 'header.html'), 'utf-8', function(err, headerData) {
                if (err) throw err;
                fs.readFile(path.join(__dirname, 'public', 'recipe.html'), 'utf-8', function(err, data) {
                    if (err) throw err;
                    let recipesHtml = '';
                    result.forEach(recipe => {
                        recipesHtml += data
                            .replace('{{image}}', recipe.image)
                            .replace('{{title}}', recipe.title)
                            .replace('{{category}}', recipe.category)
                            .replace('{{ingredients}}', recipe.ingredients)
                            .replace('{{instructions}}', recipe.instructions)
                            .replace('{{cookTime}}', recipe.cookTime)
                            .replace('{{size}}', recipe.size);
                    });
                    let fullData = `${headerData}${recipesHtml}`
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(fullData);
                });
            });
        });
    }

    // Handle GET request for about page
    else if (pathname === '/about' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'public', 'about.html'), function(err, data) {
            if (err) throw err;
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        });
    }

    // Handle GET request for authentication pages
    else if (pathname==='/authentication/login' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'public', 'authentication', 'login.html'), function(err, data) {
            if (err) throw err;
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        });
    }
    else if (pathname === '/authentication/signup' && req.method==='GET') {
        fs.readFile(path.join(__dirname, 'public', 'authentication', 'signup.html'), function(err, data) {
            if (err) throw err;
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        });
    } 
    else if (pathname === '/authentication/logout' && req.method==='GET') {
        session.deleteSession();
        res.writeHead(302, {'Location': '/'});
        res.end();
    }


    // Handle POST request for login
    else if (pathname === '/authentication/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // Convert Buffer to string
        });
        req.on('end', () => {
            // Parse form data from request body
            var formData = querystring.parse(body);
            var username = formData.username;
            var password = formData.password;
    
            var query = "SELECT * FROM users WHERE username = ? AND password = ?";
            con.query(query, [username, password], function(err, results, fields) {
                if (err){
                    console.log(err);
                    res.writeHead(500);
                    res.end("Invalid credentials");
                    return;
                };
    
                if (results.length > 0) {
                    session.setMySession(username);
                    res.writeHead(302, {'Location': '/admin'});
                } else {
                    res.writeHead(302, {'Location': '/login'});
                }
                res.end();
            });
        });
    }
    
    else if (pathname === '/authentication/signup' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            var formData = querystring.parse(body);
            var { username, email, password } = formData;
    
            // Validate if username, email, and password are present
            if (!username || !email || !password) {
                res.writeHead(400);
                res.end('Username, email, and password are required');
                return;
            }
    
            // Insert the user into the database
            var query = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
            con.query(query, [username, email, password], function (err, results, fields) {
                if (err) throw err;
                // Successful signup, redirect to admin page
                res.writeHead(302, { 'Location': '/admin' });
                res.end();
            });
        });
    }
    
    else if(pathname==='/admin'){
        session.getMySession();
        fs.readFile(path.join(__dirname, 'public', 'admin', 'index.html'), function(err, data) {
            if (err) throw err;
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        });
    }
    else if (pathname === '/admin/recipes/' && req.method === 'GET') {
        // Read header.html
        fs.readFile(path.join(__dirname, 'public', 'admin', 'recipes', 'header.html'), 'utf-8', function (err, headerData) {
            if (err) throw err;
            // Read recipe.html
            fs.readFile(path.join(__dirname, 'public', 'admin', 'recipes', 'recipe.html'), 'utf-8', function (err, recipeData) {
                if (err) throw err;
                const sql = "SELECT * FROM recipes;";
                con.query(sql, function (err, result) {
                    if (err) throw err;
                    let recipesHtml = '';
                    // Generate HTML for each recipe
                    result.forEach(recipe => {
                        recipesHtml += recipeData
                            .replace('{{id}}', recipe.id)
                            .replace('{{image}}', recipe.image)
                            .replace('{{title}}', recipe.title)
                            .replace('{{category}}', recipe.category)
                            .replace('{{ingredients}}', recipe.ingredients)
                            .replace('{{instructions}}', recipe.instructions)
                            .replace('{{cookTime}}', recipe.cookTime)
                            .replace('{{size}}', recipe.size)
                            .replace('{{id}}', recipe.id);
                    });
                    // Join header and recipe content
                    let fullHtml = `${headerData}${recipesHtml}`;
                    // Send the combined HTML as the response
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(fullHtml);
                });
            });
        });
    }
    else if (pathname === '/' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            var formData = querystring.parse(body);
            var { image, title, category, ingredients, instructions, cookTime, size } = formData;
            var sql = 'INSERT INTO recipes (image, title, category, ingredients, instructions, cookTime, size) VALUES (?, ?, ?, ?, ?, ?, ?)';
            con.query(sql, [image, title, category, ingredients, instructions, cookTime, size], function (err, result) {
                if (err) throw err;
                res.writeHead(302, { 'Location': '/admin/recipes/' });
                res.end();
            });
        });
    }

    else if (pathname.startsWith('/recipes/') && pathname.endsWith('/delete') && req.method === 'POST') {
        var id = pathname.split('/')[2]; // Extract ID from URL path
        var sql = 'DELETE FROM recipes WHERE id = ?';
        con.query(sql, [id], function (err, result) {
            if (err) throw err;
            res.writeHead(302, { 'Location': '/admin/recipes/' });
            res.end();
        });
    }
    // Serve the edit recipe form
    else if (pathname.startsWith('/recipes/') && pathname.endsWith('/edit') && req.method === 'GET') {
        var id = pathname.split('/')[2]; // Extract ID from URL path
        var sql = 'SELECT * FROM recipes WHERE id = ?';
        con.query(sql, [id], function (err, result) {
            if (err) throw err;
            if (result.length === 0) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Recipe not found');
                return;
            }
            const recipe = result[0];
            fs.readFile(path.join(__dirname, 'public', 'admin', 'recipes', 'edit-recipe.html'), 'utf-8', function (err, data) {
                if (err) throw err;
                recipe.ingredients = recipe.ingredients.replace(/<br\/>/g, '\n');
                recipe.instructions = recipe.instructions.replace(/<br\/>/g, '\n');
                // Replace placeholders with actual recipe data
                let editForm = data.replace('{{id}}', recipe.id)
                    .replace('{{image}}', recipe.image)
                    .replace('{{title}}', recipe.title)
                    .replace('{{category}}', recipe.category)
                    .replace('{{ingredients}}', recipe.ingredients)
                    .replace('{{instructions}}', recipe.instructions)
                    .replace('{{cookTime}}', recipe.cookTime)
                    .replace('{{size}}', recipe.size);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(editForm);
            });
        });
    }

    // Handle the update logic
    else if (pathname.startsWith('/recipes/') && pathname.endsWith('/edit') && req.method === 'POST') {
        var id = pathname.split('/')[2]; // Extract ID from URL path
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            var formData = querystring.parse(body);
            var { image, title, category, ingredients, instructions, cookTime, size } = formData;
            var sql = 'UPDATE recipes SET image = ?, title = ?, category = ?, ingredients = ?, instructions = ?, cookTime = ?, size = ? WHERE id = ?';
            con.query(sql, [image, title, category, ingredients, instructions, cookTime, size, id], function (err, result) {
                if (err) throw err;
                res.writeHead(302, { 'Location': '/admin/recipes/' });
                res.end();
            });
        });
    }
    // List all categories
    else if (pathname === '/admin/categories/' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'public', 'admin', 'categories', 'header.html'), 'utf-8', function (err, headerData) {
            if (err) throw err;
            fs.readFile(path.join(__dirname, 'public', 'admin', 'categories', 'category.html'), 'utf-8', function (err, catData) {
                if (err) throw err;
                var sql = "SELECT * FROM categories";
                con.query(sql, function (err, result) {
                    if (err) throw err;
                    let catHtml = '';
                    result.forEach(cat => {
                        catHtml += catData
                            .replace('{{id}}', cat.id)
                            .replace('{{name}}', cat.cat_name)
                            .replace('{{image}}', cat.image);
                    });
                    let fullData = `${headerData}${catHtml}`;
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(fullData);
                });
            });
        });
    }

    // Add a new category
    else if (pathname === '/admin/categories/' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            var formData = querystring.parse(body);
            var { name, image } = formData;
            var sql = 'INSERT INTO categories (cat_name, image) VALUES (?, ?)';
            con.query(sql, [name, image], function (err, result) {
                if (err) throw err;
                res.writeHead(302, { 'Location': '/admin/categories/' });
                res.end();
            });
        });
    }

    // Delete a category
    else if (pathname.startsWith('/admin/categories/') && pathname.endsWith('/delete') && req.method === 'POST') {
        var id = pathname.split('/')[3]; // Extract ID from URL path
        var sql = "DELETE FROM categories WHERE id=?";
        con.query(sql, [id], function (err, result) {
            if (err) throw err;
            res.writeHead(302, { 'Location': '/admin/categories/' });
            res.end();
        });
    }


    // Serve other static files (CSS, JS, images, etc.)
    else if (req.method === 'GET') {
        var filePath = path.join(__dirname, 'public',pathname);
        fs.readFile(filePath, function(err, data) {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }

            // Determine Content-Type based on file extension
            let contentType = 'text/plain';
            if (pathname.endsWith('.html')) {
                contentType = 'text/html';
            } else if (pathname.endsWith('.css')) {
                contentType = 'text/css';
            } else if (pathname.endsWith('.js')) {
                contentType = 'application/javascript';
            } // Add more content types as needed

            res.writeHead(200, {'Content-Type': contentType});
            res.end(data);
        });
    }
    // For any other route, serve 404
    else {
        res.writeHead(404);
        res.end('Page not found');
    }
}).listen(8080);
