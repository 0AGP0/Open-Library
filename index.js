import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "world",
    password: "1234",
    port: 5432,
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err);
    } else {
        console.log('Connected to PostgreSQL');
    }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.set('view engine', 'ejs'); 

app.get('/', async (req, res) =>{
    try{
        const result = await db.query('SELECT *, isbn FROM books'); // isbn sütununu seçmek için
        const books = result.rows;
        res.render("index.ejs",{
            books:books,
        });
    }catch (err){
        console.error('Error fetching books:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/add-book', async(req,res) =>{
    const {title,author,rating,isbn} = req.body;
    try{
        await db.query('INSERT INTO books (title, author, rating, isbn) VALUES ($1,$2,$3,$4)',[title,author,rating,isbn]);
        res.redirect('/');
    }catch (err){
        console.error('Error adding book:', err);
        res.status(500).send('Internal Server Error');
    }
});

async function fetchBookCover(isbn){
    try{
        const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`); // Backtick (`) kullanımı düzeltildi
        return response.request.res.responseUrl; // Resim URL'si değiştirildi
    }catch(err){
        console.error('Error fetching book cover:', err);
        return null;
    }
}

app.get('/book-cover/:isbn', async (req,res) =>{
    const {isbn} = req.params;
    const coverUrl = await fetchBookCover(isbn);
    if(coverUrl) {
        res.redirect(coverUrl);
    }else {
        res.status(404).send('Book cover not found');
    }
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
  });