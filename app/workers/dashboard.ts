import express from 'express';
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express';
import { dispatchQueue, notificationQueue } from '../libs/queue/delivery.queue';

const app = express();
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
    queues : [
        new BullMQAdapter(dispatchQueue),
        new BullMQAdapter(notificationQueue),
    ],
    serverAdapter,
})

app.use('/admin/queues',serverAdapter.getRouter());

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Bull bord running on http://localhost:${PORT}/admin/queues`);
})