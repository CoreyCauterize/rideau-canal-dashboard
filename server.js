import express from 'express';
import cors from 'cors';
import { CosmosClient } from "@azure/cosmos";


const app = express();
app.use(cors());
app.use(express.json());
const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY
});
app.use(express.static('public'));

app.get('/', (req, res) => {
    return res.sendFile('index.html', { root: 'public' });
});

app.get('/api/data', async (req, res) => {
    const location = req.query.location;
    if (!location) {
        return res.status(400).json({ error: 'Location query parameter is required' });
    }
    //non relational query to fetch data by location
    try {
        const { database: db } = await cosmosClient.databases.createIfNotExists({ id: 'RideauCanalDB' });
        const { container } = await db.containers.createIfNotExists({ id: 'DataContainer' });
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.location = @location',
            parameters: [
                { name: '@location', value: location }
            ]
        };
        const { resources: items } = await container.items.query(querySpec).fetchAll();
        res.json(items);
    } catch (error) {
        console.error('Error fetching data from Cosmos DB:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
    
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

