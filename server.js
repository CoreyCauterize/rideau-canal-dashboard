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

    try {
        const databaseId = process.env.COSMOS_DB_DATABASE || 'RideauCanalDB';
        const containerId = process.env.COSMOS_DB_CONTAINER || 'SensorAggregations';

        const db = cosmosClient.database(databaseId);
        const container = db.container(containerId);

        const querySpec = {
            query: 'SELECT TOP 1 * FROM c WHERE c.location = @location ORDER BY c.timestamp DESC',
            parameters: [
                { name: '@location', value: location }
            ]
        };

        const { resources: items } = await container.items.query(querySpec, {
            partitionKey: location
        }).fetchAll();

        if (!items || items.length === 0) {
            return res.status(404).json({ error: `No data found for location '${location}'` });
        }

        res.json(items[0]);
    } catch (error) {
        console.error('Error fetching data from Cosmos DB:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
    
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

