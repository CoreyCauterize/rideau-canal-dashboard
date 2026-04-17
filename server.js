import express from 'express';
import cors from 'cors';


const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    return res.sendFile('index.html', { root: 'public' });
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

